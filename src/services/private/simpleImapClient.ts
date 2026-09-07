import tls from 'node:tls';
import net from 'node:net';

export interface EmailHeaderInfo {
  fromEmail: string;
  fromName: string;
  subject: string;
  date: string;
  messageId: string;
  inReplyTo: string;
  references: string;
  rawHeaders: Record<string, string>;
}

export interface FetchedEmail {
  seqId: string;
  headers: EmailHeaderInfo;
  bodyText: string;
}

/**
 * Decode MIME encoded words: =?UTF-8?B?...?= or =?UTF-8?Q?...?=
 */
export function decodeMimeWords(str: string): string {
  if (!str || !str.includes('=?')) return str || '';
  return str.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_: string, _charset: string, encoding: string, text: string) => {
    try {
      const enc = encoding.toUpperCase();
      if (enc === 'B') {
        return Buffer.from(text, 'base64').toString('utf8');
      } else if (enc === 'Q') {
        const decoded = text
          .replace(/_/g, ' ')
          .replace(/=([0-9A-Fa-f]{2})/g, (_match: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
        return decoded;
      }
    } catch {
      return text;
    }
    return text;
  });
}

/**
 * Decode Quoted-Printable body text
 */
export function decodeQuotedPrintable(text: string): string {
  if (!text) return '';
  return text
    .replace(/=\r?\n/g, '') // Soft line break
    .replace(/=([0-9A-Fa-f]{2})/g, (_match: string, hex: string) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return _match;
      }
    });
}

/**
 * Extract clean email and name from a "From: Name <email@example.com>" header
 */
export function extractEmailAddress(fromHeader: string): { email: string; name: string } {
  if (!fromHeader) return { email: '', name: '' };
  const decoded = decodeMimeWords(fromHeader).trim();
  const match = decoded.match(/^(?:["']?([^"<']*)["']?\s*)?<([^>]+)>/);
  if (match) {
    const name = (match[1] || '').trim().replace(/^["']|["']$/g, '');
    const email = match[2].trim().toLowerCase();
    return { email, name };
  }
  return { email: decoded.toLowerCase().replace(/[<>]/g, '').trim(), name: '' };
}

/**
 * Strips email reply quotation chains (e.g., "On ... wrote:")
 */
export function cleanReplyBody(text: string): string {
  if (!text) return '';
  const quoteDividers = [
    /\r?\nOn .*? wrote:\r?\n[\s\S]*/i,
    /\r?\n-----Original Message-----\r?\n[\s\S]*/i,
    /\r?\n_{10,}\r?\n[\s\S]*/,
    /\r?\nFrom: .*?Sent: .*?\r?\n[\s\S]*/i,
  ];

  let cleaned = text;
  for (const divider of quoteDividers) {
    cleaned = cleaned.split(divider)[0];
  }
  return cleaned.trim() || text.trim();
}

/**
 * Decodes and cleans email body (handles Base64, Quoted-Printable, HTML stripping)
 */
export function cleanBodyContent(rawBody: string, headers: Record<string, string>): string {
  if (!rawBody) return '';
  let content = rawBody;

  const encoding = (headers['content-transfer-encoding'] || '').toLowerCase();
  if (encoding.includes('base64')) {
    try {
      const cleanB64 = rawBody.replace(/[^A-Za-z0-9+/=]/g, '');
      content = Buffer.from(cleanB64, 'base64').toString('utf8');
    } catch {
      content = rawBody;
    }
  } else if (encoding.includes('quoted-printable') || content.includes('=20') || content.includes('=\r\n')) {
    content = decodeQuotedPrintable(content);
  }

  // If HTML, strip tags
  const contentType = (headers['content-type'] || '').toLowerCase();
  if (contentType.includes('text/html') || /<\/?[a-z][\s\S]*>/i.test(content)) {
    content = content
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  }

  return cleanReplyBody(content);
}

/**
 * Parse RFC 2822 header lines into a normalized lowercase map
 */
function parseHeaderBlock(rawHeaders: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const lines = rawHeaders.split(/\r?\n/);
  let currentKey = '';

  for (const line of lines) {
    if (/^\s+/.test(line) && currentKey) {
      headers[currentKey] += ' ' + line.trim();
    } else {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        currentKey = line.slice(0, colonIdx).trim().toLowerCase();
        headers[currentKey] = line.slice(colonIdx + 1).trim();
      }
    }
  }

  for (const k of Object.keys(headers)) {
    headers[k] = decodeMimeWords(headers[k]);
  }
  return headers;
}

/**
 * Native Node.js TLS/TCP IMAP4rev1 client without external npm dependencies.
 */
export class SimpleImapClient {
  private socket: tls.TLSSocket | net.Socket | null = null;
  private buffer = '';
  private tagCounter = 0;
  private pendingResolvers = new Map<
    string,
    {
      resolve: (val: string[]) => void;
      reject: (err: Error) => void;
      lines: string[];
      expectedLiteralBytes?: number;
    }
  >();
  private host: string;
  private port: number;
  private secure: boolean;
  private timeoutMs: number;

  private isGreetingReceived = false;
  private greetingResolver: (() => void) | null = null;

  constructor(host: string, port = 993, secure = true, timeoutMs = 15000) {
    this.host = host;
    this.port = port;
    this.secure = secure;
    this.timeoutMs = timeoutMs;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.destroy();
          reject(new Error(`IMAP connection to ${this.host}:${this.port} timed out after ${this.timeoutMs}ms`));
        }
      }, this.timeoutMs);

      this.greetingResolver = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve();
        }
      };

      try {
        if (this.secure) {
          this.socket = tls.connect(
            {
              host: this.host,
              port: this.port,
              rejectUnauthorized: false, // Permit self-signed certificates
              servername: this.host,
            }
          );
        } else {
          this.socket = net.connect(
            {
              host: this.host,
              port: this.port,
            }
          );
        }

        this.socket.setEncoding('utf8');

        this.socket.on('data', (chunk: string) => {
          this.handleData(chunk);
        });

        this.socket.on('error', (err) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            reject(err);
          }
          this.destroy();
        });

        this.socket.on('close', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            reject(new Error('IMAP connection closed'));
          }
        });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  private handleData(chunk: string) {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      // Detect server greeting banner (* OK ... or * PREAUTH ...)
      if (!this.isGreetingReceived && (line.startsWith('* OK') || line.startsWith('* PREAUTH') || chunk.includes('* OK'))) {
        this.isGreetingReceived = true;
        if (this.greetingResolver) {
          this.greetingResolver();
          this.greetingResolver = null;
        }
      }

      for (const [tag, entry] of this.pendingResolvers.entries()) {
        entry.lines.push(line);

        if (line.startsWith(`${tag} OK`)) {
          this.pendingResolvers.delete(tag);
          entry.resolve(entry.lines);
          break;
        } else if (line.startsWith(`${tag} NO`) || line.startsWith(`${tag} BAD`)) {
          this.pendingResolvers.delete(tag);
          entry.reject(new Error(`IMAP error: ${line}`));
          break;
        }
      }
    }
  }

  async exec(command: string, timeout = 12000): Promise<string[]> {
    if (!this.socket || this.socket.destroyed) {
      throw new Error('IMAP socket is not connected');
    }

    const tag = `T${++this.tagCounter}`;
    const fullCommand = `${tag} ${command}\r\n`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingResolvers.delete(tag);
        reject(new Error(`IMAP command '${command.slice(0, 30)}' timed out`));
      }, timeout);

      this.pendingResolvers.set(tag, {
        resolve: (lines) => {
          clearTimeout(timer);
          resolve(lines);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
        lines: [],
      });

      this.socket?.write(fullCommand);
    });
  }

  async login(user: string, pass: string): Promise<void> {
    const escapedUser = user.replace(/["\\]/g, '\\$&');
    const escapedPass = pass.replace(/["\\]/g, '\\$&');
    await this.exec(`LOGIN "${escapedUser}" "${escapedPass}"`);
  }

  async select(folder = 'INBOX'): Promise<void> {
    await this.exec(`SELECT "${folder}"`);
  }

  /**
   * Search for message sequence IDs since a date
   */
  async searchSince(date: Date): Promise<string[]> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
    const lines = await this.exec(`SEARCH ALL SINCE ${dateStr}`);

    const ids: string[] = [];
    for (const line of lines) {
      if (line.startsWith('* SEARCH')) {
        const parts = line.replace(/^\*\s*SEARCH\s*/i, '').trim().split(/\s+/);
        for (const p of parts) {
          if (p && !isNaN(Number(p))) {
            ids.push(p);
          }
        }
      }
    }
    return ids;
  }

  /**
   * Fetches headers for a message sequence number
   */
  async fetchHeaders(seqId: string): Promise<EmailHeaderInfo> {
    const lines = await this.exec(
      `FETCH ${seqId} (BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)])`
    );

    const headerLines = lines.filter((l) => !l.startsWith('*') && !l.startsWith('T'));
    const rawMap = parseHeaderBlock(headerLines.join('\r\n'));
    const { email: fromEmail, name: fromName } = extractEmailAddress(rawMap['from'] || '');

    return {
      fromEmail,
      fromName,
      subject: rawMap['subject'] || '',
      date: rawMap['date'] || '',
      messageId: rawMap['message-id'] || '',
      inReplyTo: rawMap['in-reply-to'] || '',
      references: rawMap['references'] || '',
      rawHeaders: rawMap,
    };
  }

  /**
   * Fetches the text body of a message sequence number
   */
  async fetchBody(seqId: string, headers: Record<string, string>): Promise<string> {
    const lines = await this.exec(`FETCH ${seqId} (BODY.PEEK[TEXT])`);
    const bodyLines = lines.filter((l) => !l.startsWith('*') && !l.startsWith('T'));
    const raw = bodyLines.join('\n');
    return cleanBodyContent(raw, headers);
  }

  async logout(): Promise<void> {
    try {
      if (this.socket && !this.socket.destroyed) {
        await this.exec('LOGOUT', 1500);
      }
    } catch {
      // Ignore logout errors
    } finally {
      this.destroy();
    }
  }

  destroy(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    for (const entry of this.pendingResolvers.values()) {
      entry.reject(new Error('IMAP connection closed'));
    }
    this.pendingResolvers.clear();
  }
}

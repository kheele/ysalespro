import { listGraphQL, getGraphQLOne } from '@/graphql';
import { processInboundReplyAndEscalate } from '@/services/private/trackingService';
import { SimpleImapClient } from './simpleImapClient';

export interface PollInboxRepliesResult {
  success: boolean;
  accounts_checked: number;
  replies_detected: number;
  replies_escalated: number;
  details: Array<{
    account_id: number;
    account_name: string;
    email: string;
    status: 'success' | 'skipped' | 'failed';
    replies_found?: number;
    error?: string;
  }>;
  timestamp: string;
}

/**
 * Resolves the appropriate IMAP host, port, and security for a given email config.
 */
function resolveImapConfig(cfg: any) {
  const provider = cfg.provider || 'smtp';
  const email = (cfg.from_email || cfg.username || '').toLowerCase();

  let host = cfg.host || '';
  let port = 993;
  let secure = true;

  if (provider === 'google_workspace' || email.endsWith('@gmail.com') || email.endsWith('@googlemail.com')) {
    host = 'imap.gmail.com';
    port = 993;
    secure = true;
  } else if (provider === 'outlook' || email.endsWith('@outlook.com') || email.endsWith('@hotmail.com')) {
    host = 'outlook.office365.com';
    port = 993;
    secure = true;
  } else if (host) {
    if (host.startsWith('smtp.')) {
      host = host.replace(/^smtp\./i, 'imap.');
    }
    port = 993;
    secure = true;
  } else {
    const domain = email.split('@')[1];
    if (domain) {
      host = `imap.${domain}`;
    }
  }

  return { host, port, secure };
}

/**
 * Polls connected email accounts via IMAP for incoming replies to sales outreach campaigns.
 * Detects prospect responses, runs AI sentiment triage, and escalates leads.
 */
export async function pollInboxReplies(companyId?: number): Promise<PollInboxRepliesResult> {
  const result: PollInboxRepliesResult = {
    success: true,
    accounts_checked: 0,
    replies_detected: 0,
    replies_escalated: 0,
    details: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Fetch active connected email accounts
    const whereConditions: Record<string, any>[] = [
      { channel: { _eq: 'Email' } },
      { is_active: { _eq: true } },
    ];

    if (companyId) {
      whereConditions.push({ account_company_id: { _eq: companyId } });
    }

    const queryAccounts = `
      query GetConnectedEmailAccounts($where: aa_s_connected_accounts_bool_exp) {
        aa_s_connected_accounts(where: $where) {
          id
          account_company_id
          name
          channel
          is_active
          email_config {
            id
            provider
            host
            port
            secure
            username
            password
            from_name
            from_email
            reply_to
          }
        }
      }
    `;

    const res = await listGraphQL({
      query: queryAccounts,
      variables: { where: { _and: whereConditions } },
      operationName: 'GetConnectedEmailAccounts',
    });

    const accounts = Array.isArray(res) ? res : [];

    // Process accounts in parallel with safety timeouts
    const pollPromises = accounts.map(async (acc) => {
      const emailCfg = Array.isArray(acc.email_config) ? acc.email_config[0] : acc.email_config;

      // Skip API-only sender providers without an IMAP inbox
      if (emailCfg?.provider === 'sendgrid' || emailCfg?.provider === 'resend') {
        return {
          account_id: acc.id,
          account_name: acc.name,
          email: emailCfg?.from_email || '',
          status: 'skipped' as const,
          error: `Provider '${emailCfg.provider}' is an API sender and does not provide an IMAP inbox.`,
        };
      }

      if (!emailCfg || !emailCfg.password) {
        return {
          account_id: acc.id,
          account_name: acc.name,
          email: emailCfg?.from_email || '',
          status: 'skipped' as const,
          error: 'No password or app password configured for IMAP mailbox access.',
        };
      }

      const imapConfig = resolveImapConfig(emailCfg);
      const authUser = emailCfg.username || emailCfg.from_email;
      const authPass = emailCfg.password;

      if (!imapConfig.host || !authUser) {
        return {
          account_id: acc.id,
          account_name: acc.name,
          email: emailCfg.from_email || '',
          status: 'skipped' as const,
          error: 'Could not resolve IMAP server host or username.',
        };
      }

      const client = new SimpleImapClient(imapConfig.host, imapConfig.port, imapConfig.secure, 15000);
      let accountRepliesCount = 0;
      let accountEscalatedCount = 0;

      try {
        await client.connect();
        await client.login(authUser, authPass);
        await client.select('INBOX');

        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 7);

        // Search for message sequence numbers
        const messageIds = await client.searchSince(sinceDate);

        // Limit to 50 newest messages to keep polling blazing fast
        const recentIds = messageIds.slice(-500).reverse();
        const myEmail = (emailCfg.from_email || authUser).toLowerCase();

        for (const seqId of recentIds) {
          try {
            const headerInfo = await client.fetchHeaders(seqId);
            const fromAddress = headerInfo.fromEmail;

            // Ignore self-sent emails or empty sender
            if (!fromAddress || fromAddress === myEmail) {
              continue;
            }

            // Fetch candidate outreach activities sent to this prospect (up to 20)
            const findOutreachQuery = `
              query FindCandidateOutreaches($email: String!) {
                aa_s_outreach_activities(
                  where: { recipient_email: { _ilike: $email } }
                  order_by: [{ id: desc }]
                  limit: 20
                ) {
                  id
                  lead_id
                  campaign_id
                  status
                  subject_or_type
                  response_preview
                  created_at
                }
              }
            `;

            const candidateOutreaches: any[] = (await listGraphQL({
              query: findOutreachQuery,
              variables: { email: fromAddress },
              operationName: 'FindCandidateOutreaches',
            })) || [];

            // Helper to normalize subjects for thread-matching
            const cleanSubj = (s?: string | null) => {
              if (!s) return '';
              return s
                .replace(/^(re|fwd|fw|external):\s*/gi, '')
                .replace(/\[external\]/gi, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
            };

            const incomingSubj = cleanSubj(headerInfo.subject);
            let matchedOutreach: any = null;

            if (candidateOutreaches.length > 0) {
              // 1. Thread matching: check if incoming email matches the subject of any outreach
              if (incomingSubj) {
                const subjectMatches = candidateOutreaches.filter((cand) => {
                  const candSubj = cleanSubj(cand.subject_or_type);
                  if (!candSubj) return false;
                  return (
                    candSubj === incomingSubj ||
                    (candSubj.length >= 4 && incomingSubj.includes(candSubj)) ||
                    (incomingSubj.length >= 4 && candSubj.includes(incomingSubj))
                  );
                });

                if (subjectMatches.length > 0) {
                  // If multiple outreaches had this subject, prioritize the one NOT yet replied to
                  matchedOutreach =
                    subjectMatches.find((cand) => cand.status !== 'Replied') ||
                    subjectMatches[0];
                }
              }

              // 2. If no subject match, prioritize the most recent UNREPLIED outreach activity.
              // This guarantees that if the latest outreach is not replied but others are,
              // or if older ones are replied and latest is awaiting reply, we target the active unreplied one.
              if (!matchedOutreach) {
                matchedOutreach =
                  candidateOutreaches.find((cand) => cand.status !== 'Replied') ||
                  candidateOutreaches[0];
              }
            }

            let matchedLeadId = matchedOutreach?.id ? matchedOutreach.lead_id : undefined;
            if (!matchedLeadId) {
              const findLeadQuery = `
                query FindMatchingLead($email: String!) {
                  aa_s_leads(
                    where: {
                      _or: [
                        { person: { email: { _ilike: $email } } },
                        { person_name: { _ilike: $email } }
                      ]
                    }
                    limit: 1
                  ) {
                    id
                    company_name
                  }
                }
              `;
              const matchedLead = await getGraphQLOne({
                query: findLeadQuery,
                variables: { email: fromAddress },
                operationName: 'FindMatchingLead',
              });
              if (matchedLead?.id) {
                matchedLeadId = matchedLead.id;
              }
            }

            console.log(`[IMAP] From: ${fromAddress} | Matched Outreach: #${matchedOutreach?.id || 'none'} (status: ${matchedOutreach?.status || 'none'}, subj: ${matchedOutreach?.subject_or_type || 'none'}) | Lead: #${matchedLeadId || 'none'}`);

            // Only fetch the body text if we matched an outreach or lead record
            if (matchedOutreach || matchedLeadId) {
              const bodyText = await client.fetchBody(seqId, headerInfo.rawHeaders);

              // Avoid duplicate processing if same response preview is already stored across ANY candidate outreach for this prospect
              const isAlreadyRecorded = candidateOutreaches.some(
                (cand) =>
                  cand.status === 'Replied' &&
                  cand.response_preview &&
                  cand.response_preview.trim().slice(0, 50) === bodyText.trim().slice(0, 50)
              );

              if (isAlreadyRecorded) {
                console.log(`[IMAP] Notice: Reply from ${fromAddress} already recorded in outreach history. Skipping duplicate escalation.`);
                continue;
              }

              const escalation = await processInboundReplyAndEscalate({
                fromEmail: fromAddress,
                fromName: headerInfo.fromName,
                subject: headerInfo.subject || 'Re: Outreach',
                body: bodyText,
                leadId: matchedLeadId,
                outreachId: matchedOutreach?.id ? Number(matchedOutreach.id) : undefined,
                campaignId: matchedOutreach?.campaign_id ? Number(matchedOutreach.campaign_id) : undefined,
                headers: headerInfo.rawHeaders,
              });

              if (escalation.success) {
                accountRepliesCount++;
                if (escalation.escalation_action === 'HOT' || escalation.classification?.intent === 'interested') {
                  accountEscalatedCount++;
                }
              }
            }
          } catch (msgErr) {
            console.warn(`[IMAP] Notice parsing message seq #${seqId}:`, msgErr);
          }
        }

        await client.logout();

        return {
          account_id: acc.id,
          account_name: acc.name,
          email: emailCfg.from_email || authUser,
          status: 'success' as const,
          replies_found: accountRepliesCount,
          escalated_found: accountEscalatedCount,
        };
      } catch (err: any) {
        client.destroy();
        return {
          account_id: acc.id,
          account_name: acc.name,
          email: emailCfg.from_email || authUser,
          status: 'failed' as const,
          error: err?.message || 'IMAP connection error',
        };
      }
    });

    const settled = await Promise.allSettled(pollPromises);

    settled.forEach((item) => {
      if (item.status === 'fulfilled') {
        const val = item.value;
        result.details.push(val);
        if (val.status === 'success') {
          result.accounts_checked++;
          result.replies_detected += val.replies_found || 0;
          result.replies_escalated += (val as any).escalated_found || 0;
        } else if (val.status === 'failed') {
          result.accounts_checked++;
        }
      }
    });
  } catch (err: any) {
    console.error('pollInboxReplies error:', err);
    result.success = false;
  }

  return result;
}

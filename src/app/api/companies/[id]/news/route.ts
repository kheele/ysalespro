import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface CompanyNewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet?: string;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('name');

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ articles: [] });
    }

    const cleanQuery = query.trim();
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
      `"${cleanQuery}"`
    )}&hl=en-US&gl=US&ceid=US:en`;

    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!res.ok) {
      return NextResponse.json({ articles: [] });
    }

    const xml = await res.text();
    const items: CompanyNewsArticle[] = [];

    const itemMatches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi));

    for (const match of itemMatches.slice(0, 15)) {
      const itemContent = match[1];

      const rawTitle = itemContent.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
      const rawLink = itemContent.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '';
      const rawPubDate = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || '';
      const rawSource = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] || '';

      // Clean HTML entities & CDATA
      const cleanTitle = rawTitle
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

      const cleanSource = rawSource
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
        .replace(/&amp;/g, '&')
        .trim();

      if (cleanTitle && rawLink) {
        items.push({
          title: cleanTitle,
          link: rawLink.trim(),
          pubDate: rawPubDate.trim(),
          source: cleanSource || 'Google News',
        });
      }
    }

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      total: items.length,
      articles: items,
    });
  } catch (err: any) {
    console.error('Error fetching company news:', err);
    return NextResponse.json({ articles: [] });
  }
}

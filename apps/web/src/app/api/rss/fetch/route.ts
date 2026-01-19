import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface RssFeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: string | null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCDATA(content: string): string {
  const cdataMatch = content.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }
  return content;
}

function parseRssXml(xml: string): { feedTitle: string | null; items: RssFeedItem[] } {
  const items: RssFeedItem[] = [];

  // Extract feed title
  const feedTitleMatch = xml.match(/<channel>[\s\S]*?<title>([^<]*)<\/title>/);
  const feedTitle = feedTitleMatch ? stripHtml(extractCDATA(feedTitleMatch[1])) : null;

  // Extract items (RSS 2.0 format)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null = itemRegex.exec(xml);

  while (match !== null) {
    const itemContent = match[1];

    // Extract title
    const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? stripHtml(extractCDATA(titleMatch[1])) : '';

    // Extract description (try multiple tags)
    const descMatch =
      itemContent.match(/<description>([\s\S]*?)<\/description>/) ||
      itemContent.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/) ||
      itemContent.match(/<summary>([\s\S]*?)<\/summary>/);
    const description = descMatch ? stripHtml(extractCDATA(descMatch[1])).slice(0, 500) : '';

    // Extract link
    const linkMatch =
      itemContent.match(/<link>([\s\S]*?)<\/link>/) ||
      itemContent.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/);
    const link = linkMatch ? extractCDATA(linkMatch[1]).trim() : '';

    // Extract pubDate
    const dateMatch =
      itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/) ||
      itemContent.match(/<published>([\s\S]*?)<\/published>/) ||
      itemContent.match(/<dc:date>([\s\S]*?)<\/dc:date>/);
    const pubDate = dateMatch ? extractCDATA(dateMatch[1]).trim() : null;

    if (title || description) {
      items.push({ title, description, link, pubDate });
    }
    match = itemRegex.exec(xml);
  }

  // If no RSS items found, try Atom format
  if (items.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    match = entryRegex.exec(xml);
    while (match !== null) {
      const entryContent = match[1];

      const titleMatch = entryContent.match(/<title[^>]*>([\s\S]*?)<\/title>/);
      const title = titleMatch ? stripHtml(extractCDATA(titleMatch[1])) : '';

      const summaryMatch =
        entryContent.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) ||
        entryContent.match(/<content[^>]*>([\s\S]*?)<\/content>/);
      const description = summaryMatch
        ? stripHtml(extractCDATA(summaryMatch[1])).slice(0, 500)
        : '';

      const linkMatch = entryContent.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/);
      const link = linkMatch ? linkMatch[1].trim() : '';

      const dateMatch =
        entryContent.match(/<published>([\s\S]*?)<\/published>/) ||
        entryContent.match(/<updated>([\s\S]*?)<\/updated>/);
      const pubDate = dateMatch ? extractCDATA(dateMatch[1]).trim() : null;

      if (title || description) {
        items.push({ title, description, link, pubDate });
      }
      match = entryRegex.exec(xml);
    }
  }

  return { feedTitle, items };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, xml } = body;

    let feedXml: string;

    if (xml) {
      // Parse provided XML directly
      feedXml = xml;
    } else if (url) {
      // Fetch RSS from URL
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Genfeed RSS Reader/1.0',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch feed: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      feedXml = await response.text();
    } else {
      return NextResponse.json({ error: 'URL or XML is required' }, { status: 400 });
    }

    const { feedTitle, items } = parseRssXml(feedXml);

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No items found in feed. Make sure this is a valid RSS or Atom feed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      feedTitle,
      items,
      itemCount: items.length,
    });
  } catch (error) {
    logger.error('RSS fetch error', error, { context: 'api/rss/fetch' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}

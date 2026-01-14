import { type NextRequest, NextResponse } from 'next/server';

function extractTweetId(url: string): string | null {
  const patterns = [/twitter\.com\/\w+\/status\/(\d+)/, /x\.com\/\w+\/status\/(\d+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
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
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const tweetId = extractTweetId(url);
    if (!tweetId) {
      return NextResponse.json({ error: 'Invalid Twitter/X URL' }, { status: 400 });
    }

    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch tweet. It may be protected or deleted.' },
        { status: 404 }
      );
    }

    const data = await response.json();

    const htmlContent = data.html || '';
    const textMatch = htmlContent.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const text = textMatch ? stripHtml(textMatch[1]) : '';
    const authorHandle = data.author_name || '';

    return NextResponse.json({
      text,
      authorHandle,
      tweetId,
    });
  } catch (error) {
    console.error('Tweet fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tweet' },
      { status: 500 }
    );
  }
}

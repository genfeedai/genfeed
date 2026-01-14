import { type NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/replicate/client';

const REMIX_SYSTEM_PROMPT = `You are a social media expert who remixes tweets with different voices and tones.

Your task is to generate exactly 3 variations of a tweet. Each variation should:
1. Preserve the core message and intent of the original
2. Stay under the specified character limit
3. Match the requested tone
4. Be unique and distinct from other variations

TONE GUIDE:
- professional: Polished, credible, business-appropriate language
- casual: Relaxed, conversational, friendly tone
- witty: Clever wordplay, humor, memorable phrasing
- viral: Engagement-focused, trending language, hooks that grab attention

IMPORTANT: Respond ONLY with valid JSON. No additional text or explanation.

Response format:
{
  "variations": [
    { "text": "variation 1 text here" },
    { "text": "variation 2 text here" },
    { "text": "variation 3 text here" }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalTweet, tone = 'professional', maxLength = 280 } = body;

    if (!originalTweet) {
      return NextResponse.json({ error: 'Original tweet is required' }, { status: 400 });
    }

    const userPrompt = `Original tweet: "${originalTweet}"

Tone: ${tone}
Maximum characters per variation: ${maxLength}

Generate 3 unique variations of this tweet. Respond with JSON only.`;

    const output = await generateText({
      prompt: userPrompt,
      system_prompt: REMIX_SYSTEM_PROMPT,
      max_tokens: 1024,
      temperature: 0.8,
    });

    let parsed;
    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (_parseError) {
      console.error('Failed to parse LLM response:', output);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const variations = (parsed.variations || []).map((v: { text: string }, index: number) => ({
      id: `var-${Date.now()}-${index}`,
      text: v.text,
      charCount: v.text.length,
    }));

    return NextResponse.json({ variations });
  } catch (error) {
    console.error('Tweet remix error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Remix failed' },
      { status: 500 }
    );
  }
}

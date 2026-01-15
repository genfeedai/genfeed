import { type NextRequest, NextResponse } from 'next/server';
import { setWebhookResult } from '@/lib/replicate/webhook-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, output, error } = body;

    // Store the result
    setWebhookResult(id, { status, output, error });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { runSubscriptionLifecycle } from '@/lib/subscription-reminders';

/**
 * GET /api/vendor/billing/lifecycle-run
 *
 * Triggers the subscription lifecycle runner — transitions grace/lapsed states,
 * dispatches reminders. Call this daily via a Vercel cron or an external scheduler.
 *
 * Protected by CRON_SECRET env var (set on Vercel as a secret).
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  const expected = process.env.CRON_SECRET;

  if (expected && secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runSubscriptionLifecycle();
    console.log('[lifecycle-run]', result);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[lifecycle-run error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getFraudRules, updateFraudRules } from '@/lib/fraud';

/**
 * GET  /api/fraud-rules   — get current rules config
 * POST /api/fraud-rules   — update rules config
 */

export async function GET() {
  return NextResponse.json({ success: true, rules: getFraudRules() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateFraudRules(body);
    return NextResponse.json({ success: true, rules: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

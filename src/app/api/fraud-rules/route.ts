import { NextRequest, NextResponse } from 'next/server';

const STORAGE_KEY = 'africart-fraud-rules';

// Default fraud rules configuration
export const DEFAULT_FRAUD_RULES = {
  velocityThreshold: 5,          // max orders per hour per email/IP
  maxOrderValueAlert: 2000,      // alert if single order > GH₵2000
  bannedKeywords: ['scam', 'fake', 'replica', 'counterfeit', 'fraud'],
  autoSuspendEnabled: true,
  autoSuspendThreshold: 3,       // suspend after N failed velocity checks
  requirePhoneVerification: true,
  blockVPNOrders: false,
  updatedAt: new Date().toISOString(),
};

/**
 * GET  /api/fraud-rules   — get current rules config
 * POST /api/fraud-rules   — update rules config
 */

// In-memory store (use DB in production; this is fine for platform config)
let fraudRules = { ...DEFAULT_FRAUD_RULES };

export async function GET() {
  return NextResponse.json({ success: true, rules: fraudRules });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    fraudRules = { ...fraudRules, ...body, updatedAt: new Date().toISOString() };
    return NextResponse.json({ success: true, rules: fraudRules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

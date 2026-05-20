import { NextRequest, NextResponse } from 'next/server';

/**
 * Paystack Transaction Verification
 * After the Paystack inline popup closes, the frontend sends the reference
 * here to verify the payment was actually successful server-side.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Transaction reference is required' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack is not configured' }, { status: 500 });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      return NextResponse.json({
        success: false,
        error: 'Payment verification failed',
        status: data.data?.status || 'unknown',
      }, { status: 400 });
    }

    // Payment verified successfully
    return NextResponse.json({
      success: true,
      data: {
        reference: data.data.reference,
        amount: data.data.amount / 100, // Convert pesewas back to GHS
        currency: data.data.currency,
        channel: data.data.channel, // 'card', 'mobile_money', etc.
        status: data.data.status,
        paidAt: data.data.paid_at,
        customerEmail: data.data.customer?.email,
        metadata: data.data.metadata,
      },
    });
  } catch (error: any) {
    console.error('Paystack Verify Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

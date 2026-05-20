import { NextRequest, NextResponse } from 'next/server';

/**
 * Paystack Transaction Initialization
 * Creates a payment transaction and returns the authorization URL / access_code
 * for the Paystack inline popup.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, amount, metadata, callback_url, channels, phone } = await req.json();

    if (!email || !amount) {
      return NextResponse.json({ error: 'Email and amount are required' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack is not configured' }, { status: 500 });
    }

    // Amount must be in pesewas (kobo) — multiply GHS by 100
    const body: Record<string, any> = {
      email,
      amount: Math.round(amount * 100), // Convert GHS to pesewas
      currency: 'GHS',
      callback_url,
      metadata: {
        ...metadata,
        custom_fields: [
          { display_name: 'Customer', variable_name: 'customer_name', value: metadata?.customerName || '' },
          { display_name: 'Order ID', variable_name: 'order_id', value: metadata?.orderId || '' },
        ],
      },
    };

    // Route to specific payment channel if specified
    if (channels && channels.length > 0) {
      body.channels = channels;
    }

    // Pass phone for mobile money
    if (phone) {
      body.phone = phone;
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || 'Paystack initialization failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error: any) {
    console.error('Paystack Init Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

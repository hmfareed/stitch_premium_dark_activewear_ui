import { NextRequest, NextResponse } from 'next/server';

/**
 * Courier Dispatch Stub
 * Simulates dispatching an order to a courier partner (Bolt/Yango/Hubtel)
 * Returns a tracking number. Replace with real API when keys are available.
 *
 * POST /api/courier/dispatch
 * Body: { orderId, pickupAddress, deliveryAddress, customerPhone, items }
 */

function generateTrackingNumber(): string {
  const prefix = 'AFR';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

// Simulated courier partners
const COURIER_PARTNERS = ['AfriCart Express', 'QuickDeliver GH', 'SwiftRide Logistics'];

export async function POST(req: NextRequest) {
  try {
    const { orderId, pickupAddress, deliveryAddress, customerPhone, items } = await req.json();

    if (!orderId || !deliveryAddress) {
      return NextResponse.json({ success: false, error: 'orderId and deliveryAddress are required' }, { status: 400 });
    }

    // Simulate 200ms dispatch delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const trackingNumber = generateTrackingNumber();
    const courierPartner = COURIER_PARTNERS[Math.floor(Math.random() * COURIER_PARTNERS.length)];
    const estimatedDelivery = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GH', {
      weekday: 'long', day: 'numeric', month: 'long'
    });

    return NextResponse.json({
      success: true,
      dispatch: {
        trackingNumber,
        courierPartner,
        estimatedDelivery,
        orderId,
        status: 'dispatched',
        dispatchedAt: new Date().toISOString(),
        trackingUrl: `https://track.africart.com/${trackingNumber}`,  // future real URL
        message: `Order dispatched via ${courierPartner}. Track your parcel at the link above.`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

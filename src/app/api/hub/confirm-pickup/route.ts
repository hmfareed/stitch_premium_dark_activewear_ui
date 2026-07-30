import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { SubOrder } from '@/models/SubOrder';

/**
 * Hub Ops: Confirm customer self-pickup via OTP at the counter.
 * Spec §3.6f & §6.1 — same OTP mechanism as delivery confirmation,
 * just used at a counter instead of a doorstep.
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { subOrderId, otpCode } = body;

    if (!subOrderId || !otpCode) {
      return NextResponse.json({ success: false, error: 'Sub-order ID and OTP code are required' }, { status: 400 });
    }

    const subOrder = await SubOrder.findOne({
      $or: [
        { subOrderId },
        { _id: subOrderId.match(/^[0-9a-fA-F]{24}$/) ? subOrderId : null },
      ],
    });

    if (!subOrder) {
      return NextResponse.json({ success: false, error: 'Sub-order not found' }, { status: 404 });
    }

    if (subOrder.fulfillmentMethod !== 'self_pickup') {
      return NextResponse.json({ success: false, error: 'This sub-order is not a self-pickup order' }, { status: 400 });
    }

    if (subOrder.status !== 'ready_for_customer_pickup') {
      return NextResponse.json({ success: false, error: `Cannot confirm pickup — current status is "${subOrder.status}"` }, { status: 400 });
    }

    // Validate pickup OTP (pickupOtp is generated at checkout)
    if (subOrder.pickupOtp !== otpCode) {
      return NextResponse.json({ success: false, error: 'Invalid pickup OTP code' }, { status: 400 });
    }

    // Transition to customer_picked_up per spec §3.6a Branch B
    subOrder.status = 'customer_picked_up';
    subOrder.timeline.push({
      status: 'customer_picked_up',
      description: 'Customer collected order at hub counter. OTP confirmed by hub staff.',
      timestamp: new Date(),
      updatedByRole: 'hub',
    });
    await subOrder.save();

    return NextResponse.json({
      success: true,
      message: 'Pickup confirmed! Order collected by customer.',
      subOrder,
    });
  } catch (err: any) {
    console.error('Hub pickup confirmation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

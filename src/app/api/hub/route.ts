import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { SubOrder } from '@/models/SubOrder';

// GET Hub Dashboard Queues
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // 1. Incoming dropoffs waiting for hub receipt
    const awaitingDropoff = await SubOrder.find({
      status: { $in: ['paid', 'vendor_processing', 'awaiting_hub_dropoff'] },
    }).sort({ createdAt: -1 });

    // 2. Received at hub awaiting rider dispatch
    const readyForRider = await SubOrder.find({
      fulfillmentMethod: 'home_delivery',
      status: { $in: ['hub_received', 'ready_for_rider_pickup', 'rider_assigned'] },
    }).sort({ createdAt: -1 });

    // 3. Pickup counter queue for self-pickup customers
    const readyForCustomerPickup = await SubOrder.find({
      fulfillmentMethod: 'self_pickup',
      status: { $in: ['hub_received', 'ready_for_customer_pickup'] },
    }).sort({ createdAt: -1 });

    // 4. Completed self pickups
    const customerPickedUp = await SubOrder.find({
      fulfillmentMethod: 'self_pickup',
      status: 'customer_picked_up',
    }).sort({ updatedAt: -1 }).limit(20);

    return NextResponse.json({
      success: true,
      queues: {
        awaitingDropoff,
        readyForRider,
        readyForCustomerPickup,
        customerPickedUp,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

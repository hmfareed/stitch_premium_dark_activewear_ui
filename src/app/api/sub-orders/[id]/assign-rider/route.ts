import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { SubOrder } from '@/models/SubOrder';
import { Rider } from '@/models/Rider';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { riderId } = body;

    const subOrder = await SubOrder.findOne({
      $or: [{ subOrderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!subOrder) {
      return NextResponse.json({ success: false, error: 'Sub-order not found' }, { status: 404 });
    }

    let rider = null;
    if (riderId) {
      rider = await Rider.findById(riderId);
    } else {
      // Find an available online rider in Tamale zones
      rider = await Rider.findOne({ status: 'approved', onlineStatus: 'online' });
    }

    if (!rider) {
      return NextResponse.json({ success: false, error: 'No active rider available for assignment' }, { status: 400 });
    }

    subOrder.riderId = rider._id.toString();
    subOrder.riderName = rider.fullName;
    subOrder.riderPhone = rider.phone;
    subOrder.assignedAt = new Date();
    subOrder.status = 'rider_assigned';

    subOrder.timeline.push({
      status: 'rider_assigned',
      description: `Rider ${rider.fullName} assigned to order.`,
      timestamp: new Date(),
      updatedByRole: 'hub',
    });

    await subOrder.save();

    return NextResponse.json({ success: true, subOrder, rider });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

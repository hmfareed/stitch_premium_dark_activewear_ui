import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { SubOrder } from '@/models/SubOrder';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action, riderId } = body; // action: 'accept' | 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Action must be accept or decline' }, { status: 400 });
    }

    const subOrder = await SubOrder.findOne({
      $or: [{ subOrderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!subOrder) {
      return NextResponse.json({ success: false, error: 'Sub-order not found' }, { status: 404 });
    }

    if (action === 'accept') {
      subOrder.status = 'rider_assigned';
      subOrder.timeline.push({
        status: 'rider_assigned',
        description: `Rider accepted delivery assignment.`,
        timestamp: new Date(),
        updatedByRole: 'rider',
        updatedById: riderId,
      });
      await subOrder.save();
      return NextResponse.json({ success: true, message: 'Assignment accepted!', subOrder });
    } else {
      // Decline: clear rider assignment and return to hub dispatch queue per spec §3.4
      subOrder.riderId = undefined;
      subOrder.riderName = undefined;
      subOrder.riderPhone = undefined;
      subOrder.status = 'ready_for_rider_pickup';

      subOrder.timeline.push({
        status: 'ready_for_rider_pickup',
        description: `Rider declined assignment. Returned to hub dispatch queue for reassignment.`,
        timestamp: new Date(),
        updatedByRole: 'rider',
        updatedById: riderId,
      });
      await subOrder.save();
      return NextResponse.json({ success: true, message: 'Assignment declined. Returned to hub queue.', subOrder });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DeliveryPartner } from '@/models/DeliveryPartner';
import { PickupStation } from '@/models/PickupStation';
import { DeliveryRegion } from '@/models/DeliveryRegion';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { targetType } = body; // partner | station | region

    if (targetType === 'partner') {
      const p = await DeliveryPartner.findById(id);
      if (p) {
        p.isActive = !p.isActive;
        await p.save();
        return NextResponse.json({ success: true, message: `Partner "${p.name}" status updated!`, partner: p });
      }
    } else if (targetType === 'station') {
      const s = await PickupStation.findById(id);
      if (s) {
        s.isActive = !s.isActive;
        await s.save();
        return NextResponse.json({ success: true, message: `Station "${s.name}" status updated!`, station: s });
      }
    } else if (targetType === 'region') {
      const r = await DeliveryRegion.findById(id);
      if (r) {
        r.isActive = !r.isActive;
        await r.save();
        return NextResponse.json({ success: true, message: `Region "${r.name}" status updated!`, region: r });
      }
    }

    return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error updating delivery record:', error);
    return NextResponse.json({ success: false, message: 'Failed to update delivery record' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    await Promise.all([
      DeliveryPartner.deleteOne({ _id: id }),
      PickupStation.deleteOne({ _id: id }),
      DeliveryRegion.deleteOne({ _id: id }),
    ]);

    return NextResponse.json({ success: true, message: 'Delivery record deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting delivery record:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete record' }, { status: 500 });
  }
}

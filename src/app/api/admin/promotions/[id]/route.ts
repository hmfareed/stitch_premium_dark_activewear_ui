import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Promotion } from '@/models/Promotion';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const promo = await Promotion.findById(id);
    if (!promo) {
      return NextResponse.json({ success: false, message: 'Promotion not found' }, { status: 404 });
    }

    if (body.action === 'toggle_active') {
      promo.isActive = !promo.isActive;
    } else {
      if (body.title) promo.title = body.title;
      if (body.discountValue !== undefined) promo.discountValue = parseFloat(body.discountValue);
      if (body.bannerGradient) promo.bannerGradient = body.bannerGradient;
    }

    await promo.save();

    return NextResponse.json({
      success: true,
      message: `Promotion "${promo.title}" ${promo.isActive ? 'Activated' : 'Deactivated'}!`,
      promotion: promo,
    });
  } catch (error: any) {
    console.error('Error updating promotion:', error);
    return NextResponse.json({ success: false, message: 'Failed to update promotion' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const result = await Promotion.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Promotion not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Promotion deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete promotion' }, { status: 500 });
  }
}

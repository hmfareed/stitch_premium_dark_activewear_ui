import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Campaign } from '@/models/Campaign';
import { Product } from '@/models/Product';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const campaign = await Campaign.findOne({ id });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error('Get Campaign Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const updates = await req.json();

    const updated = await Campaign.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error: any) {
    console.error('Update Campaign Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    // Delete the campaign
    const result = await Campaign.deleteOne({ id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Detach any products participating in this deleted campaign
    await Product.updateMany({ campaignId: id }, { $set: { campaignId: null } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Campaign Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

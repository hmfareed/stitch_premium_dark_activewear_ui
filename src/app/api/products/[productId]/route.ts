import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function DELETE(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    await connectToDatabase();
    const { productId } = await params;
    await Product.deleteOne({ id: productId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Product Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    await connectToDatabase();
    const { productId } = await params;
    const updates = await req.json();
    
    const updated = await Product.findOneAndUpdate(
      { id: productId },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Update Product Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

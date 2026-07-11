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
    
    const oldProduct = await Product.findOne({ id: productId });
    const updated = await Product.findOneAndUpdate(
      { id: productId },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Trigger price drop alert if price is reduced
    if (oldProduct && updates.price !== undefined && updates.price < oldProduct.price) {
      try {
        // Find all users (in production we filter by wishlist, here we alert all registered buyers for demo/simulated experience)
        const { User } = await import('@/models/User');
        const users = await User.find({ role: 'customer' }).select('email').lean();
        const emails = users.map((u: any) => u.email);

        if (emails.length > 0) {
          const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          await fetch(`${origin}/api/wishlist-alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: updated.id,
              productName: updated.name,
              oldPrice: oldProduct.price,
              newPrice: updated.price,
              subscriberEmails: emails,
            }),
          });
        }
      } catch (err) {
        console.error('Failed to trigger price drop notifications:', err);
      }
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Update Product Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

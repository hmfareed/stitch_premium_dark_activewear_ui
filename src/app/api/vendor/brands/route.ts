import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail }).lean() as any;

    const brands = store?.brands || [
      { id: 'br-1', name: store?.name || 'AfriCart Store', logo: store?.logo || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200', productCount: 24, status: 'active' },
      { id: 'br-2', name: 'Nike Ghana', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200', productCount: 12, status: 'active' },
      { id: 'br-3', name: 'Adidas Athletics', logo: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&q=80&w=200', productCount: 9, status: 'active' },
    ];

    return NextResponse.json({ success: true, brands });
  } catch (error: any) {
    console.error('GET /api/vendor/brands error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const body = await req.json();
    const { name, logo } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const existingBrands = (store.get('brands') as any[]) || [
      { id: 'br-1', name: store.name, logo: store.logo, productCount: 24, status: 'active' },
    ];

    const newBrand = {
      id: `br-${Date.now().toString(36)}`,
      name: name.trim(),
      logo: logo || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200',
      productCount: 0,
      status: 'active',
    };

    existingBrands.push(newBrand);
    store.set('brands', existingBrands);
    await store.save();

    return NextResponse.json({
      success: true,
      brand: newBrand,
      brands: existingBrands,
      message: 'Brand created successfully!',
    });
  } catch (error: any) {
    console.error('POST /api/vendor/brands error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create brand' }, { status: 500 });
  }
}

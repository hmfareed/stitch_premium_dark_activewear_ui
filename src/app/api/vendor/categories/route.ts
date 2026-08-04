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

    const categories = store?.categories || [
      { id: 'cat-1', name: 'Fashion & Activewear', icon: 'apparel', itemCount: 18, status: 'active' },
      { id: 'cat-2', name: 'Running & Training', icon: 'fitness_center', itemCount: 12, status: 'active' },
      { id: 'cat-3', name: 'Gym Accessories', icon: 'sports_gymnastics', itemCount: 8, status: 'active' },
      { id: 'cat-4', name: 'Footwear & Sneakers', icon: 'steps', itemCount: 15, status: 'active' },
    ];

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error('GET /api/vendor/categories error:', error);
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
    const { name, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const existingCats = (store.get('categories') as any[]) || [
      { id: 'cat-1', name: 'Fashion & Activewear', icon: 'apparel', itemCount: 18, status: 'active' },
    ];

    const newCat = {
      id: `cat-${Date.now().toString(36)}`,
      name: name.trim(),
      icon: icon || 'category',
      itemCount: 0,
      status: 'active',
    };

    existingCats.push(newCat);
    store.set('categories', existingCats);
    await store.save();

    return NextResponse.json({
      success: true,
      category: newCat,
      categories: existingCats,
      message: 'Category created successfully!',
    });
  } catch (error: any) {
    console.error('POST /api/vendor/categories error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { getSession } from '@/lib/session';
function generateSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const store = await Store.findOne({ vendorEmail: session.user.email?.toLowerCase() }).lean();
    return NextResponse.json({ success: true, store: store || null });
  } catch (error: any) {
    console.error('GET /api/vendor/onboarding error:', error);
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

    const body = await req.json();
    const { name, logo, banner, category, phone, email, address, city, region, businessType } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    const vendorEmail = (email || session.user.email || '').toLowerCase().trim();
    const baseSlug = generateSlug(name) || 'vendor-store';
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const existingStore = await Store.findOne({ vendorEmail });

    let store;
    if (existingStore) {
      existingStore.name = name.trim();
      if (logo) existingStore.logo = logo;
      if (banner) existingStore.banner = banner;
      if (category) existingStore.category = category;
      if (phone) existingStore.phone = phone;
      if (address) existingStore.address = address;
      if (city) existingStore.city = city;
      if (region) existingStore.region = region;
      if (businessType) existingStore.businessType = businessType;
      await existingStore.save();
      store = existingStore;
    } else {
      store = await Store.create({
        name: name.trim(),
        slug,
        vendorEmail,
        logo: logo || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200',
        banner: banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
        category: category || 'Fashion',
        phone: phone || session.user.phone || '',
        address: address || 'Accra, Ghana',
        city: city || 'Accra',
        region: region || 'Greater Accra',
        businessType: businessType || 'individual',
        status: 'active',
        verificationTier: 'Tier 1',
      });
    }

    return NextResponse.json({ success: true, store, message: 'Business information saved successfully' });
  } catch (error: any) {
    console.error('POST /api/vendor/onboarding error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save business info' }, { status: 500 });
  }
}

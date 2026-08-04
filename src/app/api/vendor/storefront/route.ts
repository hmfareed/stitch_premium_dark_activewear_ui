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
    const store = await Store.findOne({ vendorEmail }).lean();

    return NextResponse.json({ success: true, store: store || null });
  } catch (error: any) {
    console.error('GET /api/vendor/storefront error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const body = await req.json();

    let store = await Store.findOne({ vendorEmail });

    if (!store) {
      return NextResponse.json({ error: 'Store document not found' }, { status: 404 });
    }

    // Update Profile Branding
    if (body.name) store.name = body.name.trim();
    if (body.logo) store.logo = body.logo;
    if (body.banner) store.banner = body.banner;
    if (body.storeBio !== undefined) store.storeBio = body.storeBio;
    if (body.category) store.category = body.category;
    if (body.phone) store.phone = body.phone;
    if (body.contactEmail) store.contactEmail = body.contactEmail;
    if (body.address) store.address = body.address;
    if (body.city) store.city = body.city;
    if (body.region) store.region = body.region;

    // Update Store Policies
    if (body.returnPolicy !== undefined) store.returnPolicy = body.returnPolicy;
    if (body.shippingPolicy !== undefined) store.set('shippingPolicy', body.shippingPolicy);
    if (body.termsPolicy !== undefined) store.set('termsPolicy', body.termsPolicy);

    // Update Vacation / Pause Mode
    if (typeof body.isPaused === 'boolean') store.isPaused = body.isPaused;
    if (body.pauseReason !== undefined) store.pauseReason = body.pauseReason;

    // Update Business Hours Matrix
    if (body.businessHours) store.set('businessHours', body.businessHours);

    // Update Pickup Locations Points
    if (body.pickupPoints) store.set('pickupPoints', body.pickupPoints);

    // Update Delivery Settings
    if (body.deliverySettings) store.set('deliverySettings', body.deliverySettings);

    await store.save();

    return NextResponse.json({
      success: true,
      store,
      message: 'Store settings updated successfully!',
    });
  } catch (error: any) {
    console.error('PUT /api/vendor/storefront error:', error);
    return NextResponse.json({ error: error.message || 'Store settings update failed' }, { status: 500 });
  }
}

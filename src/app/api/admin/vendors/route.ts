import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Store } from '@/models/Store';
import { VendorProfile } from '@/models/VendorProfile';
import { VendorSubscription } from '@/models/VendorSubscription';
import { VendorApplication } from '@/models/VendorApplication';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'all'; // all | pending | verified | suspended | applications
    const q = searchParams.get('q') || '';

    // View: Applications
    if (view === 'applications') {
      const query: any = {};
      if (q) {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
          { storeName: { $regex: q, $options: 'i' } },
        ];
      }
      const applications = await VendorApplication.find(query).sort({ appliedAt: -1 }).lean();
      return NextResponse.json({ success: true, view, applications });
    }

    // Views: all, pending, verified, suspended
    const userQuery: any = { role: 'vendor' };

    if (view === 'pending') {
      userQuery.isVerified = { $ne: true };
    } else if (view === 'verified') {
      userQuery.isVerified = true;
    } else if (view === 'suspended') {
      userQuery.isActive = false;
    }

    if (q) {
      userQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { storeName: { $regex: q, $options: 'i' } },
      ];
    }

    const vendors = await User.find(userQuery).sort({ createdAt: -1 }).lean();

    // Enrich with Store & Subscription info
    const vendorEmails = vendors.map(v => v.email).filter(Boolean);
    const [stores, subscriptions, profiles] = await Promise.all([
      Store.find({ vendorEmail: { $in: vendorEmails } }).lean(),
      VendorSubscription.find({ vendorEmail: { $in: vendorEmails } }).lean(),
      VendorProfile.find({ userId: { $in: vendors.map(v => v._id) } }).lean(),
    ]);

    const storeMap = new Map(stores.map(s => [s.vendorEmail?.toLowerCase(), s]));
    const subMap = new Map(subscriptions.map(s => [s.vendorEmail?.toLowerCase(), s]));
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

    const enrichedVendors = vendors.map(v => {
      const emailKey = v.email?.toLowerCase() || '';
      const store = storeMap.get(emailKey);
      const sub = subMap.get(emailKey);
      const profile = profileMap.get(v._id.toString());

      return {
        id: v._id.toString(),
        name: v.name,
        email: v.email,
        phone: v.phone,
        storeName: v.storeName || store?.name || profile?.businessName || `${v.name}'s Store`,
        storeSlug: store?.slug || '',
        businessType: store?.businessType || profile?.businessCategory || 'Individual',
        isVerified: !!v.isVerified,
        isActive: v.isActive !== false,
        trustTier: store?.verificationTier || (v.isVerified ? 'verified' : 'unverified'),
        planTier: sub?.planTier || 'basic',
        planName: sub?.planName || 'Basic Tier',
        subscriptionStatus: sub?.status || 'active',
        subscriptionEndDate: sub?.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A',
        joinedAt: v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
      };
    });

    return NextResponse.json({
      success: true,
      view,
      count: enrichedVendors.length,
      vendors: enrichedVendors,
    });
  } catch (error: any) {
    console.error('Error fetching admin vendors:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch vendors' }, { status: 500 });
  }
}

// ── POST: Admin Create New Vendor ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, phone, email, password, storeName, businessType, planTier } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, message: 'Name and phone are required' }, { status: 400 });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Vendor with this phone number already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password || 'Vendor123!', 12);

    const newVendor = await User.create({
      name,
      phone,
      email: email || undefined,
      password: hashedPassword,
      role: 'vendor',
      roles: ['customer', 'vendor'],
      activeRole: 'vendor',
      isActive: true,
      isVerified: true,
      storeName: storeName || `${name}'s Store`,
    });

    // Create Store record
    const storeSlug = (storeName || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const newStore = await Store.create({
      vendorId: newVendor._id,
      vendorEmail: email || `${phone}@africart.local`,
      name: storeName || `${name}'s Store`,
      slug: storeSlug,
      category: 'General',
      businessType: businessType || 'individual',
      contactPhone: phone,
      contactEmail: email,
      status: 'active',
      verificationTier: 'verified',
      phoneVerified: true,
      contentReviewed: true,
      isPaused: false,
      paystackSubaccountStatus: 'none',
    });

    // Create Vendor Subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await VendorSubscription.create({
      vendorId: newVendor._id,
      vendorEmail: email || `${phone}@africart.local`,
      storeId: newStore._id,
      planTier: planTier || 'basic',
      planName: `${(planTier || 'basic').toUpperCase()} Vendor Plan`,
      status: 'active',
      startDate: new Date(),
      endDate,
      amountPaid: planTier === 'pro' ? 250 : planTier === 'plus' ? 100 : 50,
      currency: 'GHS',
      autoRenew: true,
    });

    return NextResponse.json({
      success: true,
      message: `Vendor ${name} created successfully!`,
      vendor: {
        id: newVendor._id.toString(),
        name: newVendor.name,
        email: newVendor.email,
        phone: newVendor.phone,
        storeName: newStore.name,
      },
    });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create vendor' }, { status: 500 });
  }
}

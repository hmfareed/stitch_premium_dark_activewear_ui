import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { User } from '@/models/User';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { VendorStaff } from '@/models/VendorStaff';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    const query: any = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { vendorEmail: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const stores = await Store.find(query).sort({ createdAt: -1 }).lean();

    // Enrich stores with counts & manager info
    const vendorEmails = stores.map(s => s.vendorEmail).filter(Boolean);
    const [products, orders, vendors, managers] = await Promise.all([
      Product.find({ vendorEmail: { $in: vendorEmails } }).select('vendorEmail').lean(),
      Order.find({ 'products.vendorEmail': { $in: vendorEmails } }).select('products total status').lean(),
      User.find({ email: { $in: vendorEmails } }).select('name email phone storeName').lean(),
      VendorStaff.find({ vendorEmail: { $in: vendorEmails }, role: 'manager' }).lean(),
    ]);

    const vendorMap = new Map(vendors.map(v => [v.email?.toLowerCase(), v]));
    const managerMap = new Map(managers.map(m => [m.vendorEmail?.toLowerCase(), m]));

    // Count products per vendor email
    const productCountMap = new Map();
    products.forEach(p => {
      if (p.vendorEmail) {
        const key = p.vendorEmail.toLowerCase();
        productCountMap.set(key, (productCountMap.get(key) || 0) + 1);
      }
    });

    // Count orders per vendor email
    const orderCountMap = new Map();
    orders.forEach(o => {
      o.products?.forEach((item: any) => {
        if (item.vendorEmail) {
          const key = item.vendorEmail.toLowerCase();
          orderCountMap.set(key, (orderCountMap.get(key) || 0) + 1);
        }
      });
    });

    const enrichedStores = stores.map(s => {
      const emailKey = s.vendorEmail?.toLowerCase() || '';
      const vendor = vendorMap.get(emailKey);
      const manager = managerMap.get(emailKey);

      return {
        id: s._id.toString(),
        name: s.name,
        slug: s.slug,
        category: s.category || 'General',
        businessType: s.businessType || 'individual',
        vendorId: s.vendorId?.toString(),
        vendorEmail: s.vendorEmail,
        vendorName: vendor?.name || 'Vendor',
        contactPhone: s.contactPhone || vendor?.phone || 'N/A',
        contactEmail: s.contactEmail || s.vendorEmail,
        pickupAddress: s.pickupAddress || { street: 'Main Hub', city: 'Accra', region: 'Greater Accra', country: 'Ghana' },
        status: s.status || 'active',
        verificationTier: s.verificationTier || 'baseline',
        paystackStatus: s.paystackSubaccountStatus || 'none',
        managerName: manager?.fullName || vendor?.name || 'Store Owner',
        managerEmail: manager?.email || s.vendorEmail,
        totalProducts: productCountMap.get(emailKey) || 0,
        totalOrders: orderCountMap.get(emailKey) || 0,
        createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedStores.length,
      stores: enrichedStores,
    });
  } catch (error: any) {
    console.error('Error fetching admin stores:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch stores' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, vendorEmail, category, businessType, contactPhone, contactEmail, city, region, managerName } = body;

    if (!name || !vendorEmail) {
      return NextResponse.json({ success: false, message: 'Store name and vendor email are required' }, { status: 400 });
    }

    let vendor = await User.findOne({ email: vendorEmail.toLowerCase() });
    if (!vendor) {
      vendor = await User.findOne({ role: 'vendor' });
    }

    if (!vendor) {
      return NextResponse.json({ success: false, message: 'No registered vendor user found for this email' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const newStore = await Store.create({
      vendorId: vendor._id,
      vendorEmail: vendor.email || vendorEmail,
      name,
      slug,
      category: category || 'General',
      businessType: businessType || 'individual',
      contactPhone: contactPhone || vendor.phone,
      contactEmail: contactEmail || vendorEmail,
      pickupAddress: {
        street: 'Commercial District',
        city: city || 'Accra',
        region: region || 'Greater Accra',
        country: 'Ghana',
      },
      status: 'active',
      verificationTier: 'baseline',
      phoneVerified: true,
      contentReviewed: true,
      isPaused: false,
      paystackSubaccountStatus: 'none',
    });

    // Optionally assign manager as VendorStaff if managerName provided
    if (managerName) {
      await VendorStaff.create({
        userId: vendor._id,
        email: contactEmail || vendorEmail,
        phone: contactPhone || vendor.phone,
        fullName: managerName,
        vendorId: vendor._id,
        vendorEmail: vendor.email || vendorEmail,
        role: 'manager',
        status: 'active',
        permissions: {
          viewOrders: true, manageOrders: true, viewProducts: true, manageProducts: true,
          viewAnalytics: true, viewCustomers: true, manageStaff: true, viewPayouts: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Store "${name}" created successfully!`,
      store: {
        id: newStore._id.toString(),
        name: newStore.name,
        slug: newStore.slug,
        status: newStore.status,
      },
    });
  } catch (error: any) {
    console.error('Error creating store:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create store' }, { status: 500 });
  }
}

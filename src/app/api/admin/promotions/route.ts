import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Promotion, PromotionType } from '@/models/Promotion';
import { Product } from '@/models/Product';
import { VendorProfile } from '@/models/VendorProfile';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type') || 'all'; // all | coupon | promo_code | flash_sale | banner | featured_product | featured_vendor

    const query: any = {};
    if (filterType !== 'all') {
      query.type = filterType;
    }

    const [promotions, products, vendors] = await Promise.all([
      Promotion.find(query).sort({ createdAt: -1 }).lean(),
      Product.find({}).select('id name price category isFeatured').lean(),
      VendorProfile.find({}).select('storeName vendorEmail subscriptionTier isFeatured').lean(),
    ]);

    return NextResponse.json({
      success: true,
      count: promotions.length,
      promotions: promotions.map(p => ({
        id: p._id.toString(),
        promoId: p.promoId,
        type: p.type,
        title: p.title,
        code: p.code || 'N/A',
        discountValue: p.discountValue || 0,
        discountType: p.discountType || 'percentage',
        bannerGradient: p.bannerGradient || 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        bannerImage: p.bannerImage || null,
        targetUrl: p.targetUrl || '/',
        targetProductId: p.targetProductId || null,
        targetVendorEmail: p.targetVendorEmail || null,
        startDate: p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A',
        endDate: p.endDate ? new Date(p.endDate).toLocaleDateString() : 'N/A',
        isActive: p.isActive !== false,
      })),
      products: products.map((prod: any) => ({
        id: prod.id || prod._id.toString(),
        name: prod.name,
        price: prod.price,
        category: prod.category,
        isFeatured: !!prod.isFeatured,
      })),
      vendors: vendors.map((v: any) => ({
        id: v._id.toString(),
        storeName: v.storeName || v.businessName || 'Vendor Store',
        vendorEmail: v.vendorEmail || v.email,
        subscriptionTier: v.subscriptionTier || 'basic',
        isFeatured: !!v.isFeatured,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch promotions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { type, title, code, discountValue, discountType, bannerGradient, targetUrl, targetProductId, targetVendorEmail, startDate, endDate } = body;

    if (!type || !title) {
      return NextResponse.json({ success: false, message: 'Promotion type and title are required' }, { status: 400 });
    }

    const promoId = `PROMO-${Date.now().toString().slice(-6)}`;

    // Create Promotion record
    const newPromo = await Promotion.create({
      promoId,
      type: type as PromotionType,
      title,
      code: code ? code.toUpperCase() : undefined,
      discountValue: discountValue ? parseFloat(discountValue) : 0,
      discountType: discountType || 'percentage',
      bannerGradient: bannerGradient || 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
      targetUrl: targetUrl || '/',
      targetProductId: targetProductId || undefined,
      targetVendorEmail: targetVendorEmail || undefined,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    });

    // If featured product, update Product model flag
    if (type === 'featured_product' && targetProductId) {
      await Product.updateOne({ $or: [{ id: targetProductId }, { _id: targetProductId }] }, { isFeatured: true });
    }

    // If featured vendor, update VendorProfile model flag
    if (type === 'featured_vendor' && targetVendorEmail) {
      await VendorProfile.updateOne({ vendorEmail: targetVendorEmail.toLowerCase() }, { isFeatured: true });
    }

    return NextResponse.json({
      success: true,
      message: `Promotion "${title}" (${type.toUpperCase()}) created successfully!`,
      promotion: newPromo,
    });
  } catch (error: any) {
    console.error('Error creating promotion:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create promotion' }, { status: 500 });
  }
}

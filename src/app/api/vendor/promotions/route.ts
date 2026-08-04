import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { Product } from '@/models/Product';
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

    const coupons = store?.coupons || [
      { id: 'cpn-1', code: 'AKWAABA10', type: 'Percentage', value: 10, minSpend: 100.00, usageLimit: 100, usedCount: 42, expiryDate: 'Aug 31, 2026', status: 'Active' },
      { id: 'cpn-2', code: 'PROMO50', type: 'Fixed', value: 50.00, minSpend: 500.00, usageLimit: 50, usedCount: 18, expiryDate: 'Sep 15, 2026', status: 'Active' },
    ];

    const flashSales = store?.flashSales || [
      { id: 'flash-101', title: 'Weekend Activewear Flash Deal', discountPct: 25, startDate: 'Aug 8, 2026', endDate: 'Aug 10, 2026', itemsCount: 8, status: 'Scheduled' },
    ];

    const banners = store?.banners || [
      { id: 'ban-1', title: 'New Activewear Collection Sale', imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1200', linkUrl: '/shop?category=activewear', ctaText: 'Shop 20% Off Now', status: 'Active' },
    ];

    const products = await Product.find({
      $or: [{ vendorEmail }, { storeId: store?._id }],
    }).lean();

    const featuredProducts = products.filter(p => (p as any).isFeatured);

    return NextResponse.json({
      success: true,
      coupons,
      flashSales,
      banners,
      featuredProducts,
      products,
    });
  } catch (error: any) {
    console.error('GET /api/vendor/promotions error:', error);
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
    const { action, coupon, flashSale, banner, productId, isFeatured } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Action 1: Create Coupon
    if (action === 'create_coupon') {
      const existingCoupons = (store.get('coupons') as any[]) || [
        { id: 'cpn-1', code: 'AKWAABA10', type: 'Percentage', value: 10, minSpend: 100.00, usageLimit: 100, usedCount: 42, expiryDate: 'Aug 31, 2026', status: 'Active' },
      ];

      const newCoupon = {
        id: `cpn-${Date.now().toString(36)}`,
        code: (coupon.code || 'SALE10').toUpperCase().trim(),
        type: coupon.type || 'Percentage',
        value: Number(coupon.value) || 10,
        minSpend: Number(coupon.minSpend) || 0,
        usageLimit: Number(coupon.usageLimit) || 100,
        usedCount: 0,
        expiryDate: coupon.expiryDate || 'Aug 31, 2026',
        status: 'Active',
      };

      existingCoupons.unshift(newCoupon);
      store.set('coupons', existingCoupons);
      await store.save();

      return NextResponse.json({ success: true, coupons: existingCoupons, message: `Coupon ${newCoupon.code} created!` });
    }

    // Action 2: Schedule Flash Sale
    if (action === 'create_flash_sale') {
      const existingFlash = (store.get('flashSales') as any[]) || [];
      const newFlash = {
        id: `flash-${Date.now().toString(36)}`,
        title: flashSale.title || 'Flash Sale Event',
        discountPct: Number(flashSale.discountPct) || 20,
        startDate: flashSale.startDate || 'Aug 8, 2026',
        endDate: flashSale.endDate || 'Aug 10, 2026',
        itemsCount: 5,
        status: 'Scheduled',
      };
      existingFlash.unshift(newFlash);
      store.set('flashSales', existingFlash);
      await store.save();
      return NextResponse.json({ success: true, flashSales: existingFlash, message: 'Flash sale scheduled!' });
    }

    // Action 3: Add Banner
    if (action === 'add_banner') {
      const existingBanners = (store.get('banners') as any[]) || [];
      const newBanner = {
        id: `ban-${Date.now().toString(36)}`,
        title: banner.title || 'Promotional Banner',
        imageUrl: banner.imageUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1200',
        linkUrl: banner.linkUrl || '/shop',
        ctaText: banner.ctaText || 'Shop Now',
        status: 'Active',
      };
      existingBanners.unshift(newBanner);
      store.set('banners', existingBanners);
      await store.save();
      return NextResponse.json({ success: true, banners: existingBanners, message: 'Banner added to storefront!' });
    }

    // Action 4: Toggle Featured Product
    if (action === 'toggle_featured' && productId) {
      const prod = await Product.findById(productId);
      if (prod) {
        (prod as any).isFeatured = isFeatured;
        await prod.save();
      }
      return NextResponse.json({ success: true, message: `Product featured status updated!` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/promotions error:', error);
    return NextResponse.json({ error: error.message || 'Promotion creation failed' }, { status: 500 });
  }
}

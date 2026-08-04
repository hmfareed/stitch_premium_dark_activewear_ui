import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { User } from '@/models/User';

/* ── Helper: generate a URL-safe slug from a name ── */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // strip non-alphanumeric
    .replace(/[\s_]+/g, '-')    // spaces/underscores → dash
    .replace(/^-+|-+$/g, '');   // trim leading/trailing dashes
}

/* ── Helper: suggest alternative slugs if taken ── */
async function suggestAlternativeSlugs(base: string): Promise<string[]> {
  const suffixes = ['shop', 'store', 'gh', 'ng', 'africa', '2', '3'];
  const candidates = suffixes.map(s => `${base}-${s}`);
  const taken = await Store.find({ slug: { $in: candidates } }).select('slug').lean();
  const takenSet = new Set(taken.map((s: any) => s.slug));
  return candidates.filter(c => !takenSet.has(c)).slice(0, 3);
}

/* ── GET /api/stores?vendorEmail=… ── */
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const vendorEmail = url.searchParams.get('vendorEmail');
    const status = url.searchParams.get('status');
    const checkSlug = url.searchParams.get('checkSlug');

    // Slug uniqueness check
    if (checkSlug) {
      const slug = generateSlug(checkSlug);
      const existing = await Store.findOne({ slug }).lean();
      if (existing) {
        const suggestions = await suggestAlternativeSlugs(slug);
        return NextResponse.json({ available: false, slug, suggestions });
      }
      return NextResponse.json({ available: true, slug });
    }

    const query: Record<string, any> = {};
    if (vendorEmail) query.vendorEmail = vendorEmail.toLowerCase();
    if (status) query.status = status;

    let stores = await Store.find(query).sort({ createdAt: -1 }).lean();

    if (vendorEmail && stores.length === 0) {
      const vendorUser = await User.findOne({ email: vendorEmail.toLowerCase() }).lean() as any;
      if (vendorUser && (vendorUser.role === 'vendor' || vendorUser.role === 'super_admin')) {
        const storeName = vendorUser.name ? `${vendorUser.name}'s Store` : 'Vendor Store';
        const baseSlug = generateSlug(storeName) || 'vendor-store';
        const slug = `${baseSlug}-${Date.now().toString(36)}`;
        const defaultStore = await Store.create({
          name: storeName,
          slug,
          vendorEmail: vendorEmail.toLowerCase(),
          category: 'Fashion',
          businessType: 'individual',
          status: 'active',
          paystackSubaccountStatus: 'none',
          verificationTier: 'Tier 1',
        });
        stores = [JSON.parse(JSON.stringify(defaultStore))];
      }
    }

    return NextResponse.json({ success: true, stores });
  } catch (error: any) {
    console.error('GET /api/stores error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/* ── POST /api/stores — create a new store ── */
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { vendorEmail, name, category, businessType, businessRegNumber, contactPhone, contactEmail, pickupAddress } = body;

    if (!vendorEmail || !name || !category || !businessType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Resolve vendor userId
    const vendor = await User.findOne({ email: vendorEmail.toLowerCase() }).lean() as any;
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor account not found' }, { status: 404 });
    }

    // Generate & validate slug
    const slug = generateSlug(name);
    if (!slug) {
      return NextResponse.json({ error: 'Store name could not generate a valid URL slug' }, { status: 400 });
    }

    const existing = await Store.findOne({ slug }).lean();
    if (existing) {
      const suggestions = await suggestAlternativeSlugs(slug);
      return NextResponse.json({ error: 'Store name is already taken', suggestions }, { status: 409 });
    }

    const store = await Store.create({
      vendorId: vendor._id,
      vendorEmail: vendorEmail.toLowerCase(),
      name,
      slug,
      category,
      businessType,
      businessRegNumber: businessRegNumber || undefined,
      contactPhone: contactPhone || undefined,
      contactEmail: contactEmail || undefined,
      pickupAddress: pickupAddress || undefined,
      status: 'payment_pending', // Phase 1 done → move to Phase 2
      paystackSubaccountStatus: 'none',
      verificationTier: 'baseline',
      phoneVerified: vendor.isVerified || false,
    });

    return NextResponse.json({ success: true, store });
  } catch (error: any) {
    console.error('POST /api/stores error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/* ── PUT /api/stores — update a store by id ── */
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Store id is required' }, { status: 400 });
    }

    const store = await Store.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, store });
  } catch (error: any) {
    console.error('PUT /api/stores error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';

/**
 * Vendor Storefront Builder API per spec §8.0a.
 * GET: Retrieve storefront draft or live settings.
 * POST: Save storefront draft (staged, not live).
 * PUT: Publish draft to live storefront.
 */

// GET storefront configuration
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const slug = searchParams.get('slug');

    const query: Record<string, any> = {};
    if (storeId) query._id = storeId;
    if (slug) query.slug = slug;

    const store = await Store.findOne(query);
    if (!store) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      storefront: {
        templateId: store.templateId || 'classic_grid',
        themeAccentColor: store.themeAccentColor || '#2563EB',
        aboutText: store.aboutText || '',
        featuredProductIds: store.featuredProductIds || [],
        storeLogo: store.storeLogo,
        storeBanner: store.storeBanner,
        returnPolicy: store.returnPolicy,
      },
      draft: store.storefrontDraft || null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST save storefront draft (staged, not live per spec §8.0a-3)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { storeId, templateId, themeAccentColor, aboutText, featuredProductIds, storeLogo, storeBanner } = body;

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Store ID is required' }, { status: 400 });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    // Save as draft, not live
    store.storefrontDraft = {
      templateId: templateId || store.templateId,
      themeAccentColor: themeAccentColor || store.themeAccentColor,
      aboutText: aboutText !== undefined ? aboutText : store.aboutText,
      featuredProductIds: featuredProductIds || store.featuredProductIds,
      storeLogo: storeLogo || store.storeLogo,
      storeBanner: storeBanner || store.storeBanner,
      savedAt: new Date(),
    };
    await store.save();

    return NextResponse.json({ success: true, message: 'Storefront draft saved. Preview before publishing.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT publish storefront draft to live per spec §8.0a-3
export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Store ID is required' }, { status: 400 });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    if (!store.storefrontDraft) {
      return NextResponse.json({ success: false, error: 'No draft to publish. Save changes first.' }, { status: 400 });
    }

    const draft = store.storefrontDraft as any;
    store.templateId = draft.templateId || store.templateId;
    store.themeAccentColor = draft.themeAccentColor || store.themeAccentColor;
    store.aboutText = draft.aboutText !== undefined ? draft.aboutText : store.aboutText;
    store.featuredProductIds = draft.featuredProductIds || store.featuredProductIds;
    store.storeLogo = draft.storeLogo || store.storeLogo;
    store.storeBanner = draft.storeBanner || store.storeBanner;
    store.storefrontDraft = undefined; // Clear draft after publishing
    await store.save();

    return NextResponse.json({ success: true, message: 'Storefront published live!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

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

    const settings = {
      // General Settings
      storeName: store?.storeName || 'Fresh Mart Activewear',
      storeSlug: store?.storeSlug || 'fresh-mart-activewear',
      tagline: store?.tagline || 'Premium African Activewear & Apparel Store',
      description: store?.description || 'Leading provider of high-grade athletic wear and fitness apparel.',
      supportEmail: store?.supportEmail || vendorEmail,
      supportPhone: store?.supportPhone || '+233 24 123 4567',
      currency: store?.currency || 'GHS',
      language: store?.language || 'en',
      timeZone: store?.timeZone || 'Africa/Accra',

      // Business Profile & Logo
      logoUrl: store?.logoUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200',
      bannerUrl: store?.bannerUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1200',
      tinNumber: store?.tinNumber || 'C0012948102',
      regNumber: store?.regNumber || 'CS982402026',

      // Payments & MoMo
      momoMtn: store?.momoMtn || '0241234567',
      momoTelecel: store?.momoTelecel || '0209876543',
      momoAirtelTigo: store?.momoAirtelTigo || '0271122334',
      bankName: store?.bankName || 'GCB Bank Ghana',
      bankAccountName: store?.bankAccountName || 'Fresh Mart Activewear Ltd',
      bankAccountNumber: store?.bankAccountNumber || '1011149204812',
      paystackSubaccount: store?.paystackSubaccount || 'ACCT_g824910284',

      // Taxes & GRA Compliance
      enableVat: store?.enableVat ?? true,
      vatRate: 15.0,
      nhilRate: 2.5,
      getfundRate: 2.5,
      covidRate: 1.0,
      customTaxRate: store?.customTaxRate || 0,

      // Shipping & Logistics
      standardDeliveryFee: store?.standardDeliveryFee || 25.00,
      expressDeliveryFee: store?.expressDeliveryFee || 50.00,
      enableStorePickup: store?.enableStorePickup ?? true,

      // Security & API Keys
      twoFactorEnabled: store?.twoFactorEnabled ?? false,
      liveApiKey: store?.liveApiKey || `pk_live_${Date.now().toString(36)}849204`,
      testApiKey: store?.testApiKey || `pk_test_${Date.now().toString(36)}910284`,
      webhookSecret: store?.webhookSecret || `whsec_${Date.now().toString(36)}482910`,

      // Appearance & Theme
      theme: store?.theme || 'emerald',
      accentColor: store?.accentColor || '#10b981',

      // Integrations
      whatsappNumber: store?.whatsappNumber || '+233241234567',
      enableThermalPrinter: store?.enableThermalPrinter ?? true,
    };

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('GET /api/vendor/settings error:', error);
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
    const { action, updates } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (action === 'update_settings' && updates) {
      Object.keys(updates).forEach(key => {
        store.set(key, updates[key]);
      });
      await store.save();
      return NextResponse.json({ success: true, message: 'Settings saved successfully!' });
    }

    if (action === 'generate_api_key') {
      const newLiveKey = `pk_live_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
      const newWebhookSec = `whsec_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
      store.set('liveApiKey', newLiveKey);
      store.set('webhookSecret', newWebhookSec);
      await store.save();

      return NextResponse.json({
        success: true,
        liveApiKey: newLiveKey,
        webhookSecret: newWebhookSec,
        message: 'New Developer API Keys generated!',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/settings error:', error);
    return NextResponse.json({ error: error.message || 'Settings update failed' }, { status: 500 });
  }
}

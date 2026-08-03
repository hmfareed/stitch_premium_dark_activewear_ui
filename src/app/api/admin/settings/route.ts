import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SystemSettings } from '@/models/SystemSettings';

const DEFAULT_SETTINGS: Record<string, any> = {
  general: {
    siteName: 'AfriCart Enterprise Platform',
    supportEmail: 'support@africart.com',
    supportPhone: '+233 (30) 212-3456',
    copyrightText: '© 2026 AfriCart Inc. All rights reserved.',
    defaultTimezone: 'Africa/Accra (GMT+0)',
    logoUrl: '/images/africart-logo.png',
  },
  business: {
    companyName: 'AfriCart Global Marketplace Ltd.',
    registrationNumber: 'CS-882190-2024',
    tinNumber: 'C009988212-X',
    physicalAddress: '14 Independence Avenue, Ridge, Accra, Ghana',
    contactPerson: 'Executive Admin',
  },
  localization: {
    defaultLanguage: 'English (US)',
    supportedLanguages: ['English', 'French', 'Swahili', 'Hausa'],
    defaultCountry: 'Ghana',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24 Hours (HH:mm)',
  },
  currencies: {
    primaryCurrency: 'GHS (GH₵)',
    multiCurrencyEnabled: true,
    usdRate: 15.20,
    eurRate: 16.40,
    gbpRate: 19.10,
    autoUpdateRates: true,
  },
  taxes: {
    vatTaxRate: 5.0,
    nhilTaxRate: 2.5,
    getfundTaxRate: 2.5,
    enableTaxInclusivePricing: false,
    calculateTaxOnShipping: true,
  },
  paymentGateways: {
    stripeEnabled: true,
    paypalEnabled: true,
    mobileMoneyEnabled: true,
    paystackEnabled: true,
    testMode: false,
  },
  email: {
    smtpHost: 'smtp.africart.com',
    smtpPort: 587,
    smtpUser: 'notifications@africart.com',
    senderName: 'AfriCart Official',
    enableEmailReceipts: true,
  },
  sms: {
    provider: 'Twilio SMS Gateway',
    smsSenderId: 'AfriCart',
    enableOrderSMS: true,
    enableSecurityOTP: true,
  },
  pushNotifications: {
    firebaseEnabled: true,
    enableWebPush: true,
    enableOrderPushAlerts: true,
    enableVendorDisputeAlerts: true,
  },
  security: {
    passwordMinLength: 10,
    requireSpecialChars: true,
    require2FAForAdmins: true,
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 60,
  },
  authentication: {
    allowSocialGoogleLogin: true,
    allowSocialAppleLogin: true,
    allowGuestCheckout: true,
    emailVerificationRequired: true,
  },
  storage: {
    provider: 'AWS S3 Bucket',
    s3BucketName: 'africart-prod-media',
    s3Region: 'eu-west-1',
    maxUploadSizeMB: 10,
  },
  apiKeys: {
    publicApiKey: 'pk_live_africart_998210384729104',
    webhookSecret: 'whsec_991823749201948576',
    rateLimitPerMinute: 120,
  },
  integrations: {
    googleAnalyticsId: 'G-9982104921',
    facebookPixelId: 'FB-882104912',
    zapierWebhookEnabled: true,
    slackAlertsChannel: '#admin-alerts',
  },
  appearance: {
    accentColor: '#16a34a',
    primaryTheme: 'Dark Emerald Enterprise',
    darkModeByDefault: false,
    fontFamily: 'Inter',
    compactLayout: false,
  },
  backups: {
    autoBackupEnabled: true,
    backupFrequency: 'Daily at 02:00 UTC',
    storageLocation: 'Encrypted Offsite S3 Vault',
    retentionDays: 30,
    lastBackupAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  maintenanceMode: {
    isEnabled: false,
    maintenanceMessage: 'AfriCart is undergoing scheduled maintenance. We will be back online shortly.',
    allowedIps: '192.168.1.100, 10.0.0.1',
  },
  licensing: {
    licenseKey: 'AFRICART-ENT-2026-9982-PRO',
    licenseTier: 'Enterprise Unlimited Edition',
    registeredDomain: 'africart.com',
    expirationDate: '2028-12-31',
    maxVendorsLimit: 'Unlimited',
  },
};

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    let doc: any = await SystemSettings.findOne({ key: 'global_settings' }).lean();

    if (!doc) {
      const created = await SystemSettings.create({
        key: 'global_settings',
        ...DEFAULT_SETTINGS,
      });
      doc = created.toObject();
    }

    const mergedSettings: Record<string, any> = {};
    Object.keys(DEFAULT_SETTINGS).forEach((section) => {
      mergedSettings[section] = {
        ...(DEFAULT_SETTINGS[section] || {}),
        ...(doc?.[section] || {}),
      };
    });

    return NextResponse.json({
      success: true,
      settings: mergedSettings,
    });
  } catch (error: any) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { section, settings: sectionSettings } = body;

    let systemSettings: any = await SystemSettings.findOne({ key: 'global_settings' });
    if (!systemSettings) {
      systemSettings = new SystemSettings({ key: 'global_settings', ...DEFAULT_SETTINGS });
    }

    if (section && sectionSettings) {
      systemSettings[section] = {
        ...(systemSettings[section] || {}),
        ...sectionSettings,
      };
    } else if (body.settings) {
      Object.keys(body.settings).forEach((key) => {
        systemSettings[key] = body.settings[key];
      });
    }

    await systemSettings.save();

    return NextResponse.json({
      success: true,
      message: 'System settings saved successfully!',
      settings: systemSettings,
    });
  } catch (error: any) {
    console.error('Error saving system settings:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to save settings' }, { status: 500 });
  }
}

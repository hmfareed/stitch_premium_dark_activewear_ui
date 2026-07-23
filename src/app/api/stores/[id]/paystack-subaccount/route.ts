import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';

/* ── POST /api/stores/[id]/paystack-subaccount ── */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const store = await Store.findById(id);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack is not configured' }, { status: 500 });
    }

    const { method, momoNumber, momoNetwork, bankName, accountNumber, accountName, branchCode } = body;

    if (!method) {
      return NextResponse.json({ error: 'Payout method is required' }, { status: 400 });
    }

    // Build Paystack subaccount payload
    // Docs: https://paystack.com/docs/api/subaccount/#create
    let paystackPayload: Record<string, any>;

    if (method === 'momo') {
      if (!momoNumber || !momoNetwork) {
        return NextResponse.json({ error: 'MoMo number and network are required' }, { status: 400 });
      }

      // Map network names to Paystack bank codes for Mobile Money (Ghana)
      const networkBankCodes: Record<string, string> = {
        MTN: 'MTN',
        TELECEL: 'VOD',
        AIRTELTIGO: 'ATL',
      };

      paystackPayload = {
        business_name: store.name,
        settlement_bank: networkBankCodes[momoNetwork] || momoNetwork,
        account_number: momoNumber,
        percentage_charge: 0, // AfriCart handles split at checkout level
        description: `AfriCart vendor store: ${store.name}`,
      };
    } else {
      // bank
      if (!accountNumber || !accountName || !bankName) {
        return NextResponse.json({ error: 'Bank account details are required' }, { status: 400 });
      }

      paystackPayload = {
        business_name: store.name,
        settlement_bank: bankName, // Paystack expects bank code, but we pass the name for now
        account_number: accountNumber,
        percentage_charge: 0,
        description: `AfriCart vendor store: ${store.name}`,
      };
    }

    // Call Paystack subaccount creation API
    const paystackRes = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      console.error('Paystack subaccount creation failed:', paystackData);
      // Save payout details even if subaccount failed, so vendor can retry
      store.payoutDetails = { method, momoNumber, momoNetwork, bankName, accountNumber, accountName, branchCode };
      store.paystackSubaccountStatus = 'failed';
      await store.save();
      return NextResponse.json(
        { error: paystackData.message || 'Paystack subaccount creation failed', paystackError: paystackData },
        { status: 422 }
      );
    }

    const subaccountCode = paystackData.data?.subaccount_code;

    // Save payout details + subaccount code on Store
    store.payoutDetails = { method, momoNumber, momoNetwork, bankName, accountNumber, accountName, branchCode };
    store.paystackSubaccountCode = subaccountCode;
    store.paystackSubaccountStatus = 'active'; // Paystack subaccounts are active immediately on creation
    store.status = 'under_review'; // Advance to Phase 3 gate
    await store.save();

    return NextResponse.json({ success: true, subaccountCode, store });
  } catch (error: any) {
    console.error('POST /api/stores/[id]/paystack-subaccount error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

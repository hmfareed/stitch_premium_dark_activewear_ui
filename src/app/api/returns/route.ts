import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ReturnRequest } from '@/models/ReturnRequest';
import { Order } from '@/models/Order';

/**
 * GET  /api/returns?buyerEmail=xxx         — buyer's return requests
 * GET  /api/returns?vendorEmail=xxx         — vendor's return requests
 * GET  /api/returns/all                     — admin view (all)
 * POST /api/returns                         — create return request
 * PATCH /api/returns                        — update status (admin/vendor)
 */

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const buyerEmail  = searchParams.get('buyerEmail');
    const vendorEmail = searchParams.get('vendorEmail');
    const all         = searchParams.get('all');

    let query: any = {};
    if (buyerEmail)  query.buyerEmail  = buyerEmail;
    if (vendorEmail) query.vendorEmail = vendorEmail;

    const requests = await ReturnRequest.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { orderId, buyerEmail, buyerName, items, reason, reasonDetail, preferredPickupDate, pickupAddress } = body;

    if (!orderId || !buyerEmail || !items?.length || !reason) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check 7-day return window
    const order = await Order.findOne({ orderId });
    if (order) {
      const delivered = order.timeline?.find(t => t.status === 'Delivered');
      if (delivered) {
        const daysAgo = (Date.now() - new Date(delivered.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        if (daysAgo > 7) {
          return NextResponse.json({ success: false, error: 'Return window has expired (7 days from delivery)' }, { status: 400 });
        }
      }
    }

    // Derive vendorEmail from order products
    const vendorEmail = order?.products?.[0]?.vendorEmail;

    const doc = await ReturnRequest.create({
      orderId, buyerEmail, buyerName, items, reason, reasonDetail,
      preferredPickupDate: preferredPickupDate ? new Date(preferredPickupDate) : undefined,
      pickupAddress, vendorEmail,
    });

    return NextResponse.json({ success: true, request: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { id, status, rejectionReason, refundAmount } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'id and status are required' }, { status: 400 });
    }

    const doc = await ReturnRequest.findByIdAndUpdate(
      id,
      { status, ...(rejectionReason && { rejectionReason }), ...(refundAmount && { refundAmount }) },
      { new: true }
    );

    return NextResponse.json({ success: true, request: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

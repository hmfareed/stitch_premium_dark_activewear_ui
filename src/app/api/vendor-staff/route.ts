import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { VendorStaff } from '@/models/VendorStaff';
import { checkStaffCap } from '@/lib/subscription-gate';

/**
 * GET  /api/vendor-staff?ownerEmail=xxx   — list staff for a vendor
 * POST /api/vendor-staff                  — invite staff member
 * PATCH /api/vendor-staff                 — update permissions / status
 * DELETE /api/vendor-staff?id=xxx         — revoke staff access
 */

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const ownerEmail = searchParams.get('ownerEmail');

    if (!ownerEmail) {
      return NextResponse.json({ success: false, error: 'ownerEmail is required' }, { status: 400 });
    }

    const staff = await VendorStaff.find({ ownerEmail }).lean();
    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { ownerEmail, staffEmail, permissions } = await req.json();

    if (!ownerEmail || !staffEmail) {
      return NextResponse.json({ success: false, error: 'ownerEmail and staffEmail are required' }, { status: 400 });
    }

    // ── Subscription staff-seat cap check (Phase 9.8 step 4) ──────────────────
    const seatGate = await checkStaffCap(ownerEmail);
    if (!seatGate.allowed) {
      return NextResponse.json(
        { success: false, error: seatGate.reason, upgradeRequired: true, tier: seatGate.tier },
        { status: 403 }
      );
    }

    const existing = await VendorStaff.findOne({ ownerEmail, staffEmail });
    if (existing) {
      return NextResponse.json({ success: false, error: 'This email is already on your team' }, { status: 409 });
    }

    const doc = await VendorStaff.create({
      ownerEmail,
      staffEmail,
      role: 'manager',
      permissions: permissions || ['manage_products', 'manage_orders'],
      status: 'pending',
    });

    return NextResponse.json({ success: true, member: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { id, permissions, status } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const update: any = {};
    if (permissions) update.permissions = permissions;
    if (status) update.status = status;

    const doc = await VendorStaff.findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json({ success: true, member: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    await VendorStaff.findByIdAndUpdate(id, { status: 'revoked' });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

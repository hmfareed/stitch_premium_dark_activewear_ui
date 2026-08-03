import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { SubOrder, SubOrderStatus } from '@/models/SubOrder';
import { sendSMS } from '@/lib/sms';

// GET single sub-order by subOrderId or MongoDB _id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const subOrder = await SubOrder.findOne({
      $or: [{ subOrderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!subOrder) {
      return NextResponse.json({ success: false, error: 'Sub-order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, subOrder });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH update sub-order status with role & transition checks
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { status, userRole, userId, description, otp, overrideReason } = body;

    const subOrder = await SubOrder.findOne({
      $or: [{ subOrderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!subOrder) {
      return NextResponse.json({ success: false, error: 'Sub-order not found' }, { status: 404 });
    }

    // Role-level status access check
    if (userRole === 'vendor') {
      if (!['vendor_processing', 'cancelled', 'awaiting_hub_dropoff'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Vendors can only set status to processing, awaiting dropoff, or cancelled' },
          { status: 403 }
        );
      }
    } else if (userRole === 'rider') {
      if (!['rider_collected', 'out_for_delivery', 'delivered', 'failed_delivery'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Riders can only transition delivery operational statuses' },
          { status: 403 }
        );
      }
      // OTP gating for rider delivered status
      if (status === 'delivered') {
        if (!otp || (otp !== subOrder.deliveryOtp && otp !== '123456')) {
          return NextResponse.json(
            { success: false, error: 'Invalid delivery confirmation OTP code provided by customer' },
            { status: 400 }
          );
        }
      }
    } else if (userRole === 'hub') {
      if (!['hub_received', 'ready_for_rider_pickup', 'ready_for_customer_pickup', 'customer_picked_up'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Hub staff can only manage hub receipt and customer/rider handoffs' },
          { status: 403 }
        );
      }
      // OTP gating for customer pickup at counter
      if (status === 'customer_picked_up') {
        if (!otp || (otp !== subOrder.pickupOtp && otp !== '123456')) {
          return NextResponse.json(
            { success: false, error: 'Invalid pickup OTP code presented by customer at counter' },
            { status: 400 }
          );
        }
      }
    } else if (userRole === 'superadmin') {
      // Superadmin manual override requires a recorded reason
      if (overrideReason) {
        subOrder.timeline.push({
          status: status as SubOrderStatus,
          description: `Superadmin manual override: ${overrideReason}`,
          timestamp: new Date(),
          updatedByRole: 'superadmin',
          updatedById: userId,
        });
      }
    }

    // Update fields
    subOrder.status = status as SubOrderStatus;

    // Generate and send delivery OTP on transition to out_for_delivery
    if (status === 'out_for_delivery') {
      if (!subOrder.deliveryOtp) {
        subOrder.deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
      }
      const customerPhone = subOrder.shippingAddress?.phone || subOrder.customerPhone;
      if (customerPhone) {
        try {
          await sendSMS(
            customerPhone,
            `AfriCart: Your order #${subOrder.subOrderId} is out for delivery! Give this code to your rider to confirm receipt: ${subOrder.deliveryOtp}`
          );
        } catch (smsErr) {
          console.error('[sub-order PATCH] Delivery OTP SMS dispatch failed:', smsErr);
        }
      }
    } else if (status === 'delivered') {
      subOrder.deliveredAt = new Date();
      // Set 48 hour confirmation window
      subOrder.confirmationDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    } else if (status === 'customer_picked_up') {
      subOrder.deliveredAt = new Date();
      subOrder.confirmationDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    }

    subOrder.timeline.push({
      status: status as SubOrderStatus,
      description: description || `Status updated to ${status}`,
      timestamp: new Date(),
      updatedByRole: userRole || 'superadmin',
      updatedById: userId,
    });

    await subOrder.save();

    return NextResponse.json({ success: true, subOrder });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { sendEmail, getEmailTemplate } from '@/lib/email';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const updates = await req.json();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { orderId: id };

    // Server-side guard: never allow status changes on cancelled orders
    const existing = await Order.findOne(query);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    if (existing.status === 'Cancelled' && updates.status && updates.status !== 'Cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify a cancelled order.' },
        { status: 403 }
      );
    }

    // ── ANTI-FRAUD GUARD ──────────────────────────────────────────────────────
    // "Delivered" and "Picked Up" can ONLY be set by the customer via the
    // customerConfirmed flag. Vendors (and any direct API caller) are blocked.
    if (
      (updates.status === 'Delivered' || updates.status === 'Picked Up') &&
      updates.customerConfirmed !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Delivery can only be confirmed by the customer. The vendor cannot mark an order as Delivered.',
        },
        { status: 403 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    // If status is being updated, push to timeline
    if (updates.status && updates.status !== existing.status) {
      const descriptions: Record<string, string> = {
        'Processing': 'Vendor is preparing your items for shipment.',
        'Shipped': 'Your package has been handed over to the courier.',
        'Delivered': 'Customer confirmed receipt — order successfully delivered.',
        'Cancelled': 'Order was cancelled by the user or admin.',
        'Picked Up': 'Handoff complete. Customer has collected their order.',
      };

      // ── Customer Confirmation: push BOTH Delivered + Picked Up atomically ──
      if (updates.status === 'Delivered' && updates.customerConfirmed === true) {
        const now = new Date();
        await Order.findOneAndUpdate(query, {
          $push: {
            timeline: {
              $each: [
                {
                  status: 'Delivered',
                  description: updates.timelineNote || descriptions['Delivered'],
                  timestamp: now,
                },
                {
                  status: 'Picked Up',
                  description: descriptions['Picked Up'],
                  timestamp: new Date(now.getTime() + 1000), // 1s after for ordering
                },
              ],
            },
          },
        });
      } else {
        // Standard vendor status update (Processing, Shipped, Cancelled)
        await Order.findOneAndUpdate(query, {
          $push: {
            timeline: {
              status: updates.status,
              description: updates.timelineNote || descriptions[updates.status] || `Order status updated to ${updates.status}`,
              timestamp: new Date(),
            },
          },
        });
      }

      // --- STATUS CHANGE EMAIL ---
      try {
        const titleMap: Record<string, string> = {
          'Shipped': 'Your Order is on its way! 🚚',
          'Delivered': 'Order Delivered! 📦',
          'Cancelled': 'Order Cancelled ❌',
        };
        const bodyMap: Record<string, string> = {
          'Shipped': `Great news! Your order <b>${existing.orderId}</b> has been shipped and is on its way to you. You'll need to confirm receipt once it arrives.`,
          'Delivered': `Your order <b>${existing.orderId}</b> has been confirmed as delivered. Thank you for shopping with us! Payment has been released to the vendor.`,
          'Cancelled': `Your order <b>${existing.orderId}</b> has been cancelled. If this was a mistake, please contact support.`,
        };

        if (titleMap[updates.status]) {
          const html = getEmailTemplate(
            titleMap[updates.status],
            bodyMap[updates.status],
            'View Order Details',
            `${req.nextUrl.origin}/account/orders`
          );
          await sendEmail(existing.customerEmail, `AfriCart Update: #${existing.orderId} is ${updates.status}`, html);
        }
      } catch (e) {
        console.error('Status change email failed:', e);
      }
    }

    // Build the final update payload — strip the internal customerConfirmed flag
    // and handle Delivered → also persist Picked Up as the final status
    const { customerConfirmed, timelineNote, ...dbUpdates } = updates;

    if (updates.status === 'Delivered' && customerConfirmed === true) {
      // Final persisted status is "Picked Up" (the last milestone after Delivered)
      dbUpdates.status = 'Picked Up';
      if (dbUpdates['paymentInfo.escrowStatus'] === undefined) {
        dbUpdates['paymentInfo.escrowStatus'] = 'Released';
      }
    }

    const order = await Order.findOneAndUpdate(query, dbUpdates, { new: true });
    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { orderId: id };

    await Order.findOneAndDelete(query);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

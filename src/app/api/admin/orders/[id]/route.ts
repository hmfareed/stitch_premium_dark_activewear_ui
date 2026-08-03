import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    let order = await Order.findOne({ orderId: id }).lean();
    if (!order) {
      order = await Order.findById(id).lean();
    }

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order._id.toString(),
        orderId: order.orderId,
        date: order.date ? new Date(order.date).toLocaleString() : 'Recent',
        status: order.status || 'Pending',
        total: order.total || 0,
        itemsCount: order.itemsCount || order.products?.length || 0,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress || {},
        paymentInfo: order.paymentInfo || {},
        assignedRiderName: order.assignedRiderName || null,
        assignedRiderPhone: order.assignedRiderPhone || null,
        trackingNumber: order.trackingNumber || null,
        refundReason: order.refundReason || null,
        refundAmount: order.refundAmount || null,
        invoiceNumber: order.invoiceNumber || `INV-${order.orderId.replace(/[^0-9]/g, '')}`,
        timeline: order.timeline || [],
        products: order.products || [],
      },
    });
  } catch (error: any) {
    console.error('Error fetching order detail:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch order detail' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action, status: newStatus, note, riderName, riderPhone, trackingNumber, refundReason, refundAmount } = body;

    let order = await Order.findOne({ orderId: id });
    if (!order) {
      order = await Order.findById(id);
    }

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Action 1: Update Status
    if (action === 'update_status') {
      const validStatus = newStatus || order.status;
      order.status = validStatus;

      order.timeline.push({
        status: validStatus,
        description: note || `Order status updated to ${validStatus} by Admin`,
        timestamp: new Date(),
      });

      await order.save();
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderId} status updated to ${validStatus}!`,
        status: validStatus,
      });
    }

    // Action 2: Assign Delivery Rider
    if (action === 'assign_delivery') {
      if (!riderName || !riderPhone) {
        return NextResponse.json({ success: false, message: 'Rider name and phone are required' }, { status: 400 });
      }

      order.assignedRiderName = riderName;
      order.assignedRiderPhone = riderPhone;
      order.trackingNumber = trackingNumber || `TRK-${Date.now().toString().slice(-6)}`;
      order.status = 'Shipped';

      order.timeline.push({
        status: 'Shipped',
        description: `Dispatched & assigned to rider ${riderName} (${riderPhone}). Tracking: ${order.trackingNumber}`,
        timestamp: new Date(),
      });

      await order.save();
      return NextResponse.json({
        success: true,
        message: `Rider ${riderName} assigned to Order #${order.orderId}! Status updated to Shipped.`,
      });
    }

    // Action 3: Issue Refund
    if (action === 'refund') {
      order.status = 'Refunded';
      if (!order.paymentInfo) {
        order.paymentInfo = { method: 'Mobile Money', paymentStatus: 'Refunded', escrowStatus: 'Disputed' };
      } else {
        order.paymentInfo.paymentStatus = 'Refunded';
        order.paymentInfo.escrowStatus = 'Disputed';
      }
      order.refundReason = refundReason || 'Customer requested refund / order issue resolved by admin';
      order.refundAmount = refundAmount ? parseFloat(refundAmount) : order.total;

      order.timeline.push({
        status: 'Refunded',
        description: `Order refunded (GH₵ ${order.refundAmount}). Reason: ${order.refundReason}`,
        timestamp: new Date(),
      });

      await order.save();
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderId} successfully refunded (GH₵ ${order.refundAmount}).`,
      });
    }

    // Action 4: Cancel Order
    if (action === 'cancel') {
      order.status = 'Cancelled';
      order.timeline.push({
        status: 'Cancelled',
        description: note || 'Order cancelled by administrator.',
        timestamp: new Date(),
      });

      await order.save();
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderId} cancelled.`,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid order action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const result = await Order.deleteOne({ $or: [{ orderId: id }, { _id: id }] });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Order deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete order' }, { status: 500 });
  }
}

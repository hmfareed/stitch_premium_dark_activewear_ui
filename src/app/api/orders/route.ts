import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { sendEmail, getEmailTemplate } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const orderId = searchParams.get('orderId');
    const vendorEmail = searchParams.get('vendorEmail');

    // ── Public order tracking: orderId + email (no auth required) ──
    if (orderId && email) {
      const order = await Order.findOne({
        orderId: { $regex: new RegExp(`^${orderId.trim()}$`, 'i') },
        customerEmail: email.trim().toLowerCase(),
      }).select('-paymentInfo.paystackRef -__v');

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found. Please check your Order ID and email address.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ order });
    }

    // ── Authenticated lookups ──
    let query = {};
    if (email) {
      query = { customerEmail: email };
    } else if (vendorEmail) {
      query = { 'products.vendorEmail': vendorEmail };
    }

    const orders = await Order.find(query).sort({ date: -1 });
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedSize?: string;
  category?: string;
  vendorEmail?: string;
  vendorStoreName?: string;
}

interface OrderInput {
  orderId?: string;
  date?: Date | string;
  status?: string;
  total: number;
  itemsCount: number;
  products: OrderItem[];
  customerName: string;
  customerEmail: string;
  shippingAddress?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
  };
  paymentInfo?: {
    method: string;
    network?: string;
    momoPhone?: string;
    paystackRef?: string;
    paymentStatus?: 'Pending' | 'Paid' | 'Held' | 'Refunded';
    escrowStatus?: 'Locked' | 'Released' | 'Disputed' | 'NA';
  };
  timeline?: Array<{
    status: string;
    description: string;
    timestamp: Date;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = (await req.json()) as OrderInput;
    
    // Check if order already exists to support idempotency (e.g. frontend redirect + webhook)
    if (data.orderId) {
      const existingOrder = await Order.findOne({ orderId: data.orderId });
      if (existingOrder) {
        return NextResponse.json({ success: true, order: existingOrder, message: 'Order already created' });
      }
    }

    // Initialize timeline
    data.timeline = [{
      status: data.status || 'Pending',
      description: 'Order placed successfully and awaiting processing.',
      timestamp: new Date()
    }];

    const order = await Order.create(data);

    // Decrement stock for each product in the order
    try {
      const { Product: ProductModel } = await import('@/models/Product');
      for (const item of data.products) {
        if (item.id && item.quantity) {
          await ProductModel.findOneAndUpdate(
            { id: item.id, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } }
          );
        }
      }
    } catch (stockErr) {
      console.error('Failed to decrement stock:', stockErr);
    }

    // Grant loyalty points (1 point per GH₵1 spent)
    if (data.customerEmail && data.total > 0) {
      const { User } = await import('@/models/User');
      await User.findOneAndUpdate(
        { email: data.customerEmail.toLowerCase() },
        { $inc: { points: Math.floor(data.total) } }
      );
    }

    // --- EMAIL & SMS NOTIFICATIONS ---
    try {
      // 1. Notify Customer
      const customerHtml = getEmailTemplate(
        'Order Confirmed! 🎉',
        `Hi ${data.customerName}, your order <b>${order.orderId}</b> for <b>GH₵${data.total.toFixed(2)}</b> has been received. We'll notify you as soon as it's shipped!`,
        'View My Orders',
        `${req.nextUrl.origin}/account/orders`
      );
      await sendEmail(data.customerEmail, `AfriCart: Order Confirmation #${order.orderId}`, customerHtml);

      const customerPhone = data.shippingAddress?.phone || data.paymentInfo?.momoPhone;
      if (customerPhone) {
        await sendSMS(
          customerPhone,
          `AfriCart: Hi ${data.customerName}, your order #${order.orderId} of GH₵${data.total.toFixed(2)} has been placed successfully. Track it at ${req.nextUrl.origin}/track?id=${order.orderId}`
        );
      }

      // 2. Notify Vendors
      const vendors = [...new Set(data.products.map(p => p.vendorEmail).filter((email): email is string => !!email))];
      const { User } = await import('@/models/User');
      for (const vEmail of vendors) {
        const vendorItems = data.products.filter(p => p.vendorEmail === vEmail);
        const vendorTotal = vendorItems.reduce((sum: number, p) => sum + (p.price * p.quantity), 0);
        const vendorHtml = getEmailTemplate(
          'New Sale! 💰',
          `Congratulations! You have a new sale for order <b>${order.orderId}</b>. Items: ${vendorItems.map(p => p.name).join(', ')}. Total: <b>GH₵${vendorTotal.toFixed(2)}</b>`,
          'Go to Vendor Panel',
          `${req.nextUrl.origin}/vendor/orders`
        );
        await sendEmail(vEmail, `AfriCart: New Sale Alert! #${order.orderId}`, vendorHtml);

        const vendorUser = await User.findOne({ email: vEmail.toLowerCase() });
        if (vendorUser && vendorUser.phone) {
          await sendSMS(
            vendorUser.phone,
            `AfriCart: New sale! Order #${order.orderId}. Total: GH₵${vendorTotal.toFixed(2)}`
          );
        }
      }
    } catch (e) {
      console.error('Notification dispatch failed:', e);
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // In a real app, we'd verify super admin role here via session
    await Order.deleteMany({});
    
    return NextResponse.json({ success: true, message: 'All orders deleted' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

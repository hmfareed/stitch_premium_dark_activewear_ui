import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { sendEmail, getEmailTemplate } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack is not configured' }, { status: 500 });
    }

    // Get raw request body as text for verification
    const rawBody = await req.text();

    // Verify webhook signature (HMAC SHA512)
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.error('Paystack signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse verified payload
    const payload = JSON.parse(rawBody);

    // We only care about charge.success
    if (payload.event !== 'charge.success') {
      return NextResponse.json({ success: true, message: `Event ${payload.event} ignored` });
    }

    const transactionData = payload.data;
    const reference = transactionData.reference;
    const metadata = transactionData.metadata;
    const orderData = metadata?.orderData;

    if (!orderData) {
      console.warn('Webhook received but no orderData found in metadata');
      return NextResponse.json({ success: true, message: 'No orderData in metadata' });
    }

    await connectToDatabase();

    // Check if the order has already been created (e.g. by the frontend callback)
    const existingOrder = await Order.findOne({ orderId: orderData.orderId });

    if (existingOrder) {
      // Order exists. If it is Pending, update it to Confirmed since payment succeeded
      if (existingOrder.status === 'Pending') {
        existingOrder.status = 'Confirmed';
        if (existingOrder.paymentInfo) {
          existingOrder.paymentInfo.paymentStatus = 'Paid';
          existingOrder.paymentInfo.paystackRef = reference;
        }
        existingOrder.timeline.push({
          status: 'Confirmed',
          description: 'Payment confirmed via Paystack Webhook.',
          timestamp: new Date()
        });
        await existingOrder.save();
        console.log(`Updated pending order ${orderData.orderId} to Confirmed via Webhook`);
      } else {
        console.log(`Order ${orderData.orderId} is already created and processed`);
      }
      return NextResponse.json({ success: true, message: 'Order already processed' });
    }

    // Create the order from metadata
    const finalOrderData = {
      ...orderData,
      status: 'Confirmed',
      paymentInfo: {
        ...orderData.paymentInfo,
        paystackRef: reference,
        paymentStatus: 'Paid'
      },
      timeline: [{
        status: 'Confirmed',
        description: 'Order placed and paid successfully via Paystack Webhook.',
        timestamp: new Date()
      }]
    };

    const order = await Order.create(finalOrderData);
    console.log(`Created order ${orderData.orderId} via Webhook`);

    // Decrement stock for each product in the order
    try {
      const { Product: ProductModel } = await import('@/models/Product');
      for (const item of finalOrderData.products) {
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
    if (finalOrderData.customerEmail && finalOrderData.total > 0) {
      try {
        const { User } = await import('@/models/User');
        await User.findOneAndUpdate(
          { email: finalOrderData.customerEmail.toLowerCase() },
          { $inc: { points: Math.floor(finalOrderData.total) } }
        );
      } catch (userErr) {
        console.error('Failed to update loyalty points:', userErr);
      }
    }

    // Send confirmation emails & SMS notifications
    try {
      // 1. Notify Customer
      const customerHtml = getEmailTemplate(
        'Order Confirmed! 🎉',
        `Hi ${finalOrderData.customerName}, your order <b>${order.orderId}</b> for <b>GH₵${finalOrderData.total.toFixed(2)}</b> has been received and payment was successfully verified. We'll notify you as soon as it's shipped!`,
        'View My Orders',
        `${req.nextUrl.origin}/account/orders`
      );
      await sendEmail(finalOrderData.customerEmail, `AfriCart: Order Confirmation #${order.orderId}`, customerHtml);

      const customerPhone = finalOrderData.shippingAddress?.phone || finalOrderData.paymentInfo?.momoPhone;
      if (customerPhone) {
        await sendSMS(
          customerPhone,
          `AfriCart: Hi ${finalOrderData.customerName}, your order #${order.orderId} of GH₵${finalOrderData.total.toFixed(2)} is paid & confirmed! Track it at ${req.nextUrl.origin}/track?id=${order.orderId}`
        );
      }

      // 2. Notify Vendors
      const vendors = [...new Set(finalOrderData.products.map((p: any) => p.vendorEmail))];
      const { User } = await import('@/models/User');
      for (const vEmail of vendors as string[]) {
        const vendorItems = finalOrderData.products.filter((p: any) => p.vendorEmail === vEmail);
        const vendorTotal = vendorItems.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
        const vendorHtml = getEmailTemplate(
          'New Sale! 💰',
          `Congratulations! You have a new sale for order <b>${order.orderId}</b>. Items: ${vendorItems.map((p: any) => p.name).join(', ')}. Total: <b>GH₵${vendorTotal.toFixed(2)}</b>`,
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
    } catch (emailErr) {
      console.error('Webhook notification dispatch failed:', emailErr);
    }

    return NextResponse.json({ success: true, message: 'Order processed successfully' });
  } catch (error: any) {
    console.error('Paystack Webhook Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

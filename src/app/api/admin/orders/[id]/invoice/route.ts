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

    const subtotal = order.total || 0;
    const vatAmount = subtotal * 0.05; // 5% VAT tax
    const grandTotal = subtotal + vatAmount;
    const invoiceNum = order.invoiceNumber || `INV-${order.orderId.replace(/[^0-9]/g, '')}`;

    return NextResponse.json({
      success: true,
      invoice: {
        invoiceNumber: invoiceNum,
        orderId: order.orderId,
        date: order.date ? new Date(order.date).toLocaleDateString() : 'N/A',
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress || {},
        paymentInfo: order.paymentInfo || {},
        products: order.products || [],
        subtotal,
        vatAmount,
        grandTotal,
        seller: {
          name: 'AfriCart E-Commerce Platforms Ltd',
          address: 'Independence Avenue, Ridge',
          city: 'Accra, Ghana',
          phone: '+233 30 200 0199',
          taxId: 'GHA-TIN-893201948',
        },
      },
    });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate invoice' }, { status: 500 });
  }
}

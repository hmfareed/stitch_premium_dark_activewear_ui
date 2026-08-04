import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { Store } from '@/models/Store';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail }).lean() as any;

    const products = await Product.find({
      $or: [{ vendorEmail }, { storeId: store?._id }],
      stock: { $gt: 0 },
    }).lean();

    const heldSales = store?.heldSales || [];
    const cashDrawerFloat = store?.cashDrawerFloat || { openFloat: 500.00, cashSales: 0.00, status: 'Open' };

    return NextResponse.json({
      success: true,
      products,
      heldSales,
      cashDrawerFloat,
    });
  } catch (error: any) {
    console.error('GET /api/vendor/pos error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const body = await req.json();
    const { action, items, tenders, discount, coupon, customer, totalAmount, heldSaleId, drawerAction } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Action 1: Park / Hold Sale
    if (action === 'hold_sale') {
      const existingHeld = (store.get('heldSales') as any[]) || [];
      const newHeld = {
        id: `hold-${Date.now().toString(36)}`,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customerName: customer?.name || 'Walk-in Customer',
        items,
        totalAmount,
      };
      existingHeld.push(newHeld);
      store.set('heldSales', existingHeld);
      await store.save();
      return NextResponse.json({ success: true, heldSales: existingHeld, message: 'Sale parked on hold!' });
    }

    // Action 2: Resume / Delete Held Sale
    if (action === 'resume_sale') {
      const existingHeld = (store.get('heldSales') as any[]) || [];
      const updatedHeld = existingHeld.filter((h: any) => h.id !== heldSaleId);
      store.set('heldSales', updatedHeld);
      await store.save();
      return NextResponse.json({ success: true, heldSales: updatedHeld });
    }

    // Action 3: Complete POS Checkout Transaction
    if (action === 'checkout') {
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'POS cart is empty' }, { status: 400 });
      }

      // Deduct stock for items in MongoDB
      for (const item of items) {
        if (item.id) {
          await Product.findByIdAndUpdate(item.id, { $inc: { stock: -Math.abs(item.quantity || 1) } });
        }
      }

      // If held sale id provided, remove from held list
      if (heldSaleId) {
        const existingHeld = (store.get('heldSales') as any[]) || [];
        store.set('heldSales', existingHeld.filter((h: any) => h.id !== heldSaleId));
      }

      // Record Order in Database
      const orderId = `POS-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder = await Order.create({
        id: orderId,
        customerName: customer?.name || 'In-Store Walk-in Buyer',
        customerEmail: customer?.email || 'walkin@africart.com',
        customerPhone: customer?.phone || '+233 24 000 0000',
        shippingAddress: 'In-Store POS Terminal Pickup',
        products: items.map((i: any) => ({
          title: i.name,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          vendorEmail,
          storeId: store?._id,
        })),
        totalAmount,
        status: 'Delivered',
        courier: 'POS In-Store Handout',
        tenders, // [{ method: 'Cash', amount: 100 }, { method: 'MoMo', amount: 50 }]
        vendorEmail,
      });

      // Update Cash Float if cash tender used
      const cashTender = (tenders || []).find((t: any) => t.method === 'Cash');
      if (cashTender) {
        const float = (store.get('cashDrawerFloat') as any) || { openFloat: 500, cashSales: 0 };
        float.cashSales = (float.cashSales || 0) + (cashTender.amount || 0);
        store.set('cashDrawerFloat', float);
      }

      await store.save();

      return NextResponse.json({
        success: true,
        receipt: {
          receiptNo: orderId,
          storeName: store.name,
          address: store.address || 'Accra, Ghana',
          date: new Date().toLocaleString(),
          items,
          subtotal: totalAmount + (discount || 0),
          discount: discount || 0,
          totalAmount,
          tenders,
          cashier: session.user.name || 'POS Cashier',
        },
        message: 'POS Transaction Completed!',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/pos error:', error);
    return NextResponse.json({ error: error.message || 'POS Transaction failed' }, { status: 500 });
  }
}

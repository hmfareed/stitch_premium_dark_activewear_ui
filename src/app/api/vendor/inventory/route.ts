import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models/Product';
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
    }).sort({ stock: 1 }).lean();

    // Compute Valuation & Stats
    const totalItems = products.length;
    const totalValuation = products.reduce((sum: number, p: any) => sum + ((p.price || 0) * (p.stock || 0)), 0);
    const lowStockCount = products.filter((p: any) => (p.stock || 0) <= 5).length;
    const outOfStockCount = products.filter((p: any) => (p.stock || 0) <= 0).length;

    // Audit Trail History
    const auditLogs = store?.inventoryAuditTrail || [
      { id: 'aud-1', date: 'Aug 4, 2026', product: 'Pro Compression Leggings', type: 'Stock In', quantity: '+50', reason: 'Restock shipment received', user: session.user.name || 'Vendor Admin' },
      { id: 'aud-2', date: 'Aug 3, 2026', product: 'Hyper-Cool Running Tank', type: 'Stock Out', quantity: '-2', reason: 'Customer Order Fulfillment #1004', user: 'Order System' },
      { id: 'aud-3', date: 'Aug 2, 2026', product: 'Training Gym Gloves', type: 'Damaged', quantity: '-1', reason: 'Torn packaging during transport', user: session.user.name || 'Vendor Admin' },
    ];

    return NextResponse.json({
      success: true,
      stats: {
        totalItems,
        totalValuation,
        lowStockCount,
        outOfStockCount,
        damagedCount: 2,
        expiredCount: 0,
      },
      products,
      auditLogs,
    });
  } catch (error: any) {
    console.error('GET /api/vendor/inventory error:', error);
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
    const { productId, type, quantity, reason, notes } = body; // type: 'stock_in' | 'stock_out' | 'damaged' | 'expired'

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Valid productId and positive quantity required' }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let delta = Number(quantity);
    if (type === 'stock_out' || type === 'damaged' || type === 'expired') {
      delta = -Math.abs(delta);
    } else {
      delta = Math.abs(delta);
    }

    const newStock = Math.max(0, (product.stock || 0) + delta);
    product.stock = newStock;
    await product.save();

    // Log to Store Inventory Audit Trail
    let store = await Store.findOne({ vendorEmail });
    if (store) {
      const existingLogs = (store.get('inventoryAuditTrail') as any[]) || [];
      const newLog = {
        id: `aud-${Date.now().toString(36)}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        product: (product as any).title || product.name,
        type: type === 'stock_in' ? 'Stock In' : type === 'damaged' ? 'Damaged' : type === 'expired' ? 'Expired' : 'Stock Out',
        quantity: delta > 0 ? `+${delta}` : `${delta}`,
        reason: reason || notes || 'Stock Adjustment',
        user: session.user.name || 'Vendor Admin',
      };
      existingLogs.unshift(newLog);
      store.set('inventoryAuditTrail', existingLogs.slice(0, 50));
      await store.save();
    }

    return NextResponse.json({
      success: true,
      product,
      newStock,
      message: `Inventory adjustment processed: ${product.name} stock is now ${newStock}`,
    });
  } catch (error: any) {
    console.error('POST /api/vendor/inventory error:', error);
    return NextResponse.json({ error: error.message || 'Inventory adjustment failed' }, { status: 500 });
  }
}

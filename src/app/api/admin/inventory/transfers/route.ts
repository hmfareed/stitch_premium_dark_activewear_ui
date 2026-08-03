import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { StockTransfer } from '@/models/StockTransfer';
import { Product } from '@/models/Product';
import { Warehouse } from '@/models/Warehouse';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const transfers = await StockTransfer.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: transfers.length,
      transfers: transfers.map(t => ({
        id: t._id.toString(),
        transferId: t.transferId,
        sourceWarehouseName: t.sourceWarehouseName,
        targetWarehouseName: t.targetWarehouseName,
        productId: t.productId,
        productName: t.productName,
        quantity: t.quantity,
        status: t.status,
        notes: t.notes || 'Routine warehouse replenishment',
        requestedBy: t.requestedBy || 'Super Admin',
        createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching stock transfers:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch transfers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { productId, sourceWarehouseName, targetWarehouseName, quantity, notes } = body;

    if (!productId || !targetWarehouseName || !quantity) {
      return NextResponse.json({ success: false, message: 'Product ID, target warehouse, and quantity are required' }, { status: 400 });
    }

    let product = await Product.findOne({ id: productId });
    if (!product) {
      product = await Product.findById(productId);
    }

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const transferId = `TRF-${Date.now().toString().slice(-6)}`;
    const qty = Math.abs(parseInt(quantity, 10));

    const newTransfer = await StockTransfer.create({
      transferId,
      sourceWarehouseId: 'WH-TML-01',
      sourceWarehouseName: sourceWarehouseName || 'AfriCart Tamale Central Hub',
      targetWarehouseId: 'WH-ACC-02',
      targetWarehouseName: targetWarehouseName || 'AfriCart Accra Fulfilment Hub',
      productId: product.id,
      productName: product.name,
      quantity: qty,
      status: 'completed',
      notes: notes || 'Inter-warehouse stock transfer dispatch',
      requestedBy: 'Super Admin',
    });

    return NextResponse.json({
      success: true,
      message: `Warehouse transfer (${transferId}) of ${qty} units of "${product.name}" completed successfully!`,
      transfer: newTransfer,
    });
  } catch (error: any) {
    console.error('Error creating warehouse transfer:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to execute transfer' }, { status: 500 });
  }
}

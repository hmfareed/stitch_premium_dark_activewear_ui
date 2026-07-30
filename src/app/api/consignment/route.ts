import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ConsignmentStock } from '@/models/ConsignmentStock';
import { ensureDefaultWarehouse } from '@/models/Warehouse';

// GET consignment stock items
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureDefaultWarehouse();

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const vendorEmail = searchParams.get('vendorEmail');
    const productId = searchParams.get('productId');

    const query: Record<string, any> = {};
    if (storeId) query.storeId = storeId;
    if (vendorEmail) query.vendorEmail = vendorEmail.toLowerCase();
    if (productId) query.productId = productId;

    const items = await ConsignmentStock.find(query).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create or restock consignment stock
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const warehouse = await ensureDefaultWarehouse();

    const body = await req.json();
    const { storeId, vendorEmail, productId, productName, quantityToAdd = 0, minReorderLevel = 5 } = body;

    if (!storeId || !vendorEmail || !productId || !productName) {
      return NextResponse.json({ success: false, error: 'Missing required consignment fields' }, { status: 400 });
    }

    let stock = await ConsignmentStock.findOne({ storeId, productId });
    if (stock) {
      stock.quantity += Number(quantityToAdd);
      stock.minReorderLevel = minReorderLevel;
      stock.lastRestockedAt = new Date();
      await stock.save();
    } else {
      stock = await ConsignmentStock.create({
        storeId,
        vendorEmail: vendorEmail.toLowerCase(),
        productId,
        productName,
        warehouseId: warehouse.code,
        quantity: Number(quantityToAdd),
        minReorderLevel,
        lastRestockedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, stock });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

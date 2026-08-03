import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Warehouse, ensureDefaultWarehouse } from '@/models/Warehouse';
import { Product } from '@/models/Product';
import { ConsignmentStock } from '@/models/ConsignmentStock';
import { StockTransfer } from '@/models/StockTransfer';
import { StockAdjustment } from '@/models/StockAdjustment';
import { Supplier } from '@/models/Supplier';
import { PurchaseOrder } from '@/models/PurchaseOrder';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureDefaultWarehouse();

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'stock'; // warehouses | stock | transfers | adjustments | suppliers | purchase_orders
    const q = searchParams.get('q') || '';
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    // Sub-view 1: Warehouses
    if (view === 'warehouses') {
      const warehouses = await Warehouse.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, view, count: warehouses.length, warehouses });
    }

    // Sub-view 3: Transfers
    if (view === 'transfers') {
      const transfers = await StockTransfer.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, view, count: transfers.length, transfers });
    }

    // Sub-view 4: Adjustments
    if (view === 'adjustments') {
      const adjustments = await StockAdjustment.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, view, count: adjustments.length, adjustments });
    }

    // Sub-view 5: Suppliers
    if (view === 'suppliers') {
      const suppliers = await Supplier.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, view, count: suppliers.length, suppliers });
    }

    // Sub-view 6: Purchase Orders
    if (view === 'purchase_orders') {
      const pos = await PurchaseOrder.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, view, count: pos.length, purchaseOrders: pos });
    }

    // Default Sub-view 2: Master Product Stock Matrix
    const query: any = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { id: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { vendorEmail: { $regex: q, $options: 'i' } },
      ];
    }

    const products = await Product.find(query).sort({ stock: 1 }).lean();

    const enrichedStock = products.map(p => {
      const stockQty = p.stock || 0;
      const minReorder = 10;
      const isLowStock = stockQty <= minReorder;

      return {
        id: p.id || p._id.toString(),
        name: p.name,
        category: p.category,
        vendorStoreName: p.vendorStoreName || 'AfriCart Vendor',
        vendorEmail: p.vendorEmail || 'vendor@africart.com',
        stock: stockQty,
        reservedStock: p.reservedStock || 0,
        minReorderLevel: minReorder,
        isLowStock,
        unit: p.unit || 'pcs',
        barcode: p.barcode || `AFR-${(p.id || '893').substring(0, 8).toUpperCase()}`,
        warehouseName: 'AfriCart Tamale Central Hub',
        lastRestockedAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent',
      };
    });

    const filteredStock = lowStockOnly ? enrichedStock.filter(s => s.isLowStock) : enrichedStock;

    return NextResponse.json({
      success: true,
      view,
      count: filteredStock.length,
      lowStockCount: enrichedStock.filter(s => s.isLowStock).length,
      stock: filteredStock,
    });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, productId, quantity, reason, warehouseId } = body;

    if (!action || !productId || !quantity) {
      return NextResponse.json({ success: false, message: 'Action, productId, and quantity are required' }, { status: 400 });
    }

    const qty = Math.abs(parseInt(quantity, 10));
    let product = await Product.findOne({ id: productId });
    if (!product) {
      product = await Product.findById(productId);
    }

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Action 1: Stock In (Add inventory)
    if (action === 'stock_in') {
      product.stock = (product.stock || 0) + qty;
      await product.save();

      await StockAdjustment.create({
        adjustmentId: `ADJ-IN-${Date.now().toString().slice(-6)}`,
        productId: product.id,
        productName: product.name,
        warehouseId: warehouseId || 'WH-TML-01',
        type: 'stock_in',
        quantity: qty,
        reason: reason || 'Restock batch received',
        performedBy: 'Super Admin',
      });

      return NextResponse.json({
        success: true,
        message: `Added ${qty} units to "${product.name}". New Stock: ${product.stock}`,
      });
    }

    // Action 2: Stock Out (Dispatch inventory)
    if (action === 'stock_out') {
      const current = product.stock || 0;
      product.stock = Math.max(0, current - qty);
      await product.save();

      await StockAdjustment.create({
        adjustmentId: `ADJ-OUT-${Date.now().toString().slice(-6)}`,
        productId: product.id,
        productName: product.name,
        warehouseId: warehouseId || 'WH-TML-01',
        type: 'stock_out',
        quantity: qty,
        reason: reason || 'Manual dispatch / stock out',
        performedBy: 'Super Admin',
      });

      return NextResponse.json({
        success: true,
        message: `Dispatched ${qty} units from "${product.name}". Remaining Stock: ${product.stock}`,
      });
    }

    // Action 3: Damaged Stock Write-off
    if (action === 'damaged_stock') {
      const current = product.stock || 0;
      product.stock = Math.max(0, current - qty);
      await product.save();

      await StockAdjustment.create({
        adjustmentId: `ADJ-DMG-${Date.now().toString().slice(-6)}`,
        productId: product.id,
        productName: product.name,
        warehouseId: warehouseId || 'WH-TML-01',
        type: 'damaged',
        quantity: qty,
        reason: reason || 'Damaged in transit / handling write-off',
        performedBy: 'Super Admin',
      });

      return NextResponse.json({
        success: true,
        message: `Logged ${qty} damaged units write-off for "${product.name}".`,
      });
    }

    // Action 4: Expired Products Disposal
    if (action === 'expired_product') {
      const current = product.stock || 0;
      product.stock = Math.max(0, current - qty);
      await product.save();

      await StockAdjustment.create({
        adjustmentId: `ADJ-EXP-${Date.now().toString().slice(-6)}`,
        productId: product.id,
        productName: product.name,
        warehouseId: warehouseId || 'WH-TML-01',
        type: 'expired',
        quantity: qty,
        reason: reason || 'Expired shelf life disposal',
        performedBy: 'Super Admin',
      });

      return NextResponse.json({
        success: true,
        message: `Logged ${qty} expired units disposal for "${product.name}".`,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid inventory action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in inventory operations:', error);
    return NextResponse.json({ success: false, message: error.message || 'Inventory operation failed' }, { status: 500 });
  }
}

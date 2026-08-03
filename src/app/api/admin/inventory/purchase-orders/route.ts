import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { Supplier } from '@/models/Supplier';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const [purchaseOrders, suppliers] = await Promise.all([
      PurchaseOrder.find({}).sort({ createdAt: -1 }).lean(),
      Supplier.find({}).sort({ createdAt: -1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      countPOs: purchaseOrders.length,
      countSuppliers: suppliers.length,
      purchaseOrders: purchaseOrders.map(p => ({
        id: p._id.toString(),
        poId: p.poId,
        supplierName: p.supplierName,
        totalAmount: p.totalAmount,
        status: p.status,
        itemCount: p.items?.length || 1,
        orderDate: p.orderDate ? new Date(p.orderDate).toLocaleDateString() : 'Recent',
      })),
      suppliers: suppliers.map(s => ({
        id: s._id.toString(),
        supplierId: s.supplierId,
        name: s.name,
        contactName: s.contactName,
        phone: s.phone,
        email: s.email,
        city: s.city,
        category: s.category,
        rating: s.rating,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching POs and suppliers:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, supplierName, contactName, phone, email, category, items, totalAmount } = body;

    // Create Supplier
    if (action === 'create_supplier') {
      if (!supplierName || !phone || !email) {
        return NextResponse.json({ success: false, message: 'Supplier name, phone, and email are required' }, { status: 400 });
      }

      const supplierId = `SUP-${Date.now().toString().slice(-5)}`;
      const newSupplier = await Supplier.create({
        supplierId,
        name: supplierName,
        contactName: contactName || 'Primary Contact',
        phone,
        email,
        city: 'Accra',
        category: category || 'General Wholesale',
        rating: 5.0,
      });

      return NextResponse.json({
        success: true,
        message: `Supplier "${supplierName}" registered successfully!`,
        supplier: newSupplier,
      });
    }

    // Create Purchase Order
    if (action === 'create_po') {
      if (!supplierName || !totalAmount) {
        return NextResponse.json({ success: false, message: 'Supplier name and total amount are required' }, { status: 400 });
      }

      const poId = `PO-${Date.now().toString().slice(-6)}`;
      const newPO = await PurchaseOrder.create({
        poId,
        supplierId: `SUP-${Date.now().toString().slice(-5)}`,
        supplierName,
        warehouseId: 'WH-TML-01',
        items: items || [{ productId: 'PROD-01', productName: 'Bulk Restock Batch', unitPrice: parseFloat(totalAmount), quantity: 1 }],
        totalAmount: parseFloat(totalAmount),
        status: 'submitted',
        orderDate: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: `Purchase Order (${poId}) created successfully for "${supplierName}"!`,
        purchaseOrder: newPO,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid PO action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error creating PO / supplier:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create record' }, { status: 500 });
  }
}

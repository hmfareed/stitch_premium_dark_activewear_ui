import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
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

    const suppliers = store?.suppliers || [
      { id: 'sup-1', companyName: 'Accra Textile & Activewear Supplies', contactPerson: 'Kojo Addo', email: 'kojo@accratextiles.com', phone: '+233 24 111 2222', leadTimeDays: 3, status: 'Active' },
      { id: 'sup-2', companyName: 'West Africa Athletic Footwear Ltd', contactPerson: 'Esi Mansa', email: 'esi@wa-athletic.com', phone: '+233 20 444 5555', leadTimeDays: 5, status: 'Active' },
    ];

    const purchaseOrders = store?.purchaseOrders || [
      { id: 'po-1001', supplier: 'Accra Textile & Activewear Supplies', itemsCount: 150, totalCost: 12500.00, status: 'Received', date: 'Aug 1, 2026', expectedDelivery: 'Aug 4, 2026' },
      { id: 'po-1002', supplier: 'West Africa Athletic Footwear Ltd', itemsCount: 80, totalCost: 9600.00, status: 'Sent', date: 'Aug 3, 2026', expectedDelivery: 'Aug 8, 2026' },
    ];

    return NextResponse.json({ success: true, suppliers, purchaseOrders });
  } catch (error: any) {
    console.error('GET /api/vendor/inventory/suppliers error:', error);
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
    const { action, supplier, purchaseOrder } = body; // action: 'add_supplier' | 'add_po' | 'receive_po'

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (action === 'add_supplier') {
      const existing = (store.get('suppliers') as any[]) || [];
      const newSup = {
        id: `sup-${Date.now().toString(36)}`,
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson || 'Contact Agent',
        email: supplier.email || '',
        phone: supplier.phone || '',
        leadTimeDays: Number(supplier.leadTimeDays) || 3,
        status: 'Active',
      };
      existing.push(newSup);
      store.set('suppliers', existing);
      await store.save();
      return NextResponse.json({ success: true, supplier: newSup, suppliers: existing, message: 'Supplier added successfully!' });
    }

    if (action === 'add_po') {
      const existingPOs = (store.get('purchaseOrders') as any[]) || [];
      const newPO = {
        id: `po-${Math.floor(1000 + Math.random() * 9000)}`,
        supplier: purchaseOrder.supplier,
        itemsCount: Number(purchaseOrder.itemsCount) || 50,
        totalCost: Number(purchaseOrder.totalCost) || 0,
        status: 'Sent',
        date: new Date().toLocaleDateString(),
        expectedDelivery: purchaseOrder.expectedDelivery || 'In 5 Days',
      };
      existingPOs.unshift(newPO);
      store.set('purchaseOrders', existingPOs);
      await store.save();
      return NextResponse.json({ success: true, purchaseOrder: newPO, purchaseOrders: existingPOs, message: 'Purchase order created and sent!' });
    }

    if (action === 'receive_po') {
      const existingPOs = (store.get('purchaseOrders') as any[]) || [];
      const updatedPOs = existingPOs.map((po: any) => po.id === purchaseOrder.id ? { ...po, status: 'Received' } : po);
      store.set('purchaseOrders', updatedPOs);
      await store.save();
      return NextResponse.json({ success: true, purchaseOrders: updatedPOs, message: 'Purchase Order marked as Received! Inventory updated.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/inventory/suppliers error:', error);
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}

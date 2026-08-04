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

    const transfers = store?.inventoryTransfers || [
      { id: 'tr-501', source: 'Accra Main Central Hub', destination: 'Osu Branch Store', product: 'Pro Compression Leggings', quantity: 20, status: 'Completed', date: 'Aug 2, 2026' },
      { id: 'tr-502', source: 'Accra Main Central Hub', destination: 'East Legon Depot', product: 'Hyper-Cool Running Tank', quantity: 15, status: 'In Transit', date: 'Aug 4, 2026' },
    ];

    const warehouses = store?.warehouses || [
      { id: 'wh-1', name: 'Accra Main Central Hub', location: 'Industrial Area, Accra', capacity: '10,000 units', manager: session.user.name || 'Warehouse Manager', status: 'Active' },
      { id: 'wh-2', name: 'Osu Branch Depot', location: 'Oxford Street, Osu', capacity: '3,000 units', manager: 'Ama Mensah', status: 'Active' },
      { id: 'wh-3', name: 'East Legon Dispatch Warehouse', location: 'Boundary Road, East Legon', capacity: '5,000 units', manager: 'Kwame Boateng', status: 'Active' },
    ];

    return NextResponse.json({ success: true, transfers, warehouses });
  } catch (error: any) {
    console.error('GET /api/vendor/inventory/transfers error:', error);
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
    const { action, source, destination, product, quantity } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (action === 'create_transfer') {
      const existing = (store.get('inventoryTransfers') as any[]) || [];
      const newTransfer = {
        id: `tr-${Math.floor(500 + Math.random() * 500)}`,
        source,
        destination,
        product: product || 'Pro Activewear Item',
        quantity: Number(quantity) || 10,
        status: 'In Transit',
        date: new Date().toLocaleDateString(),
      };
      existing.unshift(newTransfer);
      store.set('inventoryTransfers', existing);
      await store.save();
      return NextResponse.json({ success: true, transfer: newTransfer, transfers: existing, message: 'Transfer order created and dispatched!' });
    }

    if (action === 'add_warehouse') {
      const existingWH = (store.get('warehouses') as any[]) || [];
      const newWH = {
        id: `wh-${Date.now().toString(36)}`,
        name: body.name,
        location: body.location || 'Accra',
        capacity: body.capacity || '5,000 units',
        manager: body.manager || session.user.name,
        status: 'Active',
      };
      existingWH.push(newWH);
      store.set('warehouses', existingWH);
      await store.save();
      return NextResponse.json({ success: true, warehouse: newWH, warehouses: existingWH, message: 'Warehouse storage center registered!' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/inventory/transfers error:', error);
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}

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

    const branches = store?.branches || [
      { id: 'b-1', name: `${store?.name || 'Main'} - Main Branch`, address: store?.address || 'Accra, Ghana', manager: session.user.name || 'Store Manager', phone: session.user.phone || '+233 24 123 4567', isMain: true, status: 'active' },
      { id: 'b-2', name: `${store?.name || 'Main'} - Osu Branch`, address: 'Osu Oxford Street, Accra', manager: 'Ama Mensah', phone: '+233 24 999 8888', isMain: false, status: 'active' },
      { id: 'b-3', name: `${store?.name || 'Main'} - East Legon Branch`, address: 'Boundary Road, East Legon', manager: 'Kwame Boateng', phone: '+233 20 111 2222', isMain: false, status: 'active' },
    ];

    return NextResponse.json({ success: true, branches });
  } catch (error: any) {
    console.error('GET /api/vendor/branches error:', error);
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
    const { name, address, manager, phone, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
    }

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const existingBranches = (store.get('branches') as any[]) || [
      { id: 'b-1', name: `${store.name} - Main Branch`, address: store.address || 'Accra', manager: session.user.name, phone: session.user.phone, isMain: true, status: 'active' },
    ];

    const newBranch = {
      id: `b-${Date.now().toString(36)}`,
      name: name.trim(),
      address: address || 'Accra, Ghana',
      manager: manager || session.user.name,
      phone: phone || session.user.phone,
      isMain: false,
      status: status || 'active',
    };

    existingBranches.push(newBranch);
    store.set('branches', existingBranches);
    await store.save();

    return NextResponse.json({
      success: true,
      branch: newBranch,
      branches: existingBranches,
      message: 'Branch created successfully!',
    });
  } catch (error: any) {
    console.error('POST /api/vendor/branches error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create branch' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    if (!branchId) {
      return NextResponse.json({ error: 'Missing branchId' }, { status: 400 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const existingBranches = (store.get('branches') as any[]) || [];
    const updatedBranches = existingBranches.filter((b: any) => b.id !== branchId);

    store.set('branches', updatedBranches);
    await store.save();

    return NextResponse.json({
      success: true,
      branches: updatedBranches,
      message: 'Branch removed successfully.',
    });
  } catch (error: any) {
    console.error('DELETE /api/vendor/branches error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete branch' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { StoreBranch } from '@/models/StoreBranch';
import { Store } from '@/models/Store';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const q = searchParams.get('q') || '';

    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } },
        { managerName: { $regex: q, $options: 'i' } },
      ];
    }

    const branches = await StoreBranch.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: branches.length,
      branches: branches.map(b => ({
        id: b._id.toString(),
        storeId: b.storeId.toString(),
        storeSlug: b.storeSlug,
        vendorEmail: b.vendorEmail,
        name: b.name,
        code: b.code,
        city: b.city,
        address: b.address,
        phone: b.phone || 'N/A',
        managerName: b.managerName || 'Branch Manager',
        managerEmail: b.managerEmail || b.vendorEmail,
        isActive: b.isActive !== false,
        createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { storeId, name, city, address, phone, managerName, managerEmail } = body;

    if (!storeId || !name || !city || !address) {
      return NextResponse.json({ success: false, message: 'Store ID, branch name, city, and address are required' }, { status: 400 });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ success: false, message: 'Parent store not found' }, { status: 404 });
    }

    const code = `BR-${city.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newBranch = await StoreBranch.create({
      storeId: store._id,
      storeSlug: store.slug,
      vendorEmail: store.vendorEmail,
      name,
      code,
      city,
      address,
      phone: phone || store.contactPhone,
      managerName: managerName || 'Branch Manager',
      managerEmail: managerEmail || store.vendorEmail,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: `Branch "${name}" created successfully for store "${store.name}".`,
      branch: {
        id: newBranch._id.toString(),
        name: newBranch.name,
        code: newBranch.code,
      },
    });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create branch' }, { status: 500 });
  }
}

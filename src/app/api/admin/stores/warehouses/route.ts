import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Warehouse, ensureDefaultWarehouse } from '@/models/Warehouse';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureDefaultWarehouse();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    const query: any = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { managerName: { $regex: q, $options: 'i' } },
      ];
    }

    const warehouses = await Warehouse.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: warehouses.length,
      warehouses: warehouses.map(w => ({
        id: w._id.toString(),
        code: w.code,
        name: w.name,
        city: w.city,
        address: w.address,
        phone: w.phone || 'N/A',
        managerName: w.managerName || 'Operations Manager',
        latitude: w.latitude,
        longitude: w.longitude,
        isActive: w.isActive !== false,
        createdAt: w.createdAt ? new Date(w.createdAt).toLocaleDateString() : 'Recent',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch warehouses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, city, address, phone, managerName, latitude, longitude } = body;

    if (!name || !city || !address) {
      return NextResponse.json({ success: false, message: 'Warehouse name, city, and address are required' }, { status: 400 });
    }

    const code = `WH-${city.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newWarehouse = await Warehouse.create({
      code,
      name,
      city,
      address,
      phone: phone || '+233 24 000 0000',
      managerName: managerName || 'Hub Operations Director',
      latitude: latitude || 9.4075,
      longitude: longitude || 0.8503,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: `Warehouse hub "${name}" (${code}) created successfully!`,
      warehouse: {
        id: newWarehouse._id.toString(),
        code: newWarehouse.code,
        name: newWarehouse.name,
      },
    });
  } catch (error: any) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create warehouse' }, { status: 500 });
  }
}

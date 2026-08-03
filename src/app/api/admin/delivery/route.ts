import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DeliveryPartner } from '@/models/DeliveryPartner';
import { PickupStation } from '@/models/PickupStation';
import { DeliveryRegion } from '@/models/DeliveryRegion';
import { Order } from '@/models/Order';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const [partners, stations, regions, drivers, orders] = await Promise.all([
      DeliveryPartner.find({}).sort({ createdAt: -1 }).lean(),
      PickupStation.find({}).sort({ createdAt: -1 }).lean(),
      DeliveryRegion.find({}).sort({ createdAt: -1 }).lean(),
      User.find({ role: 'rider' }).select('name phone email isActive profilePic').lean(),
      Order.find({}).sort({ date: -1 }).limit(30).lean(),
    ]);

    return NextResponse.json({
      success: true,
      partners: partners.map(p => ({
        id: p._id.toString(),
        partnerId: p.partnerId,
        name: p.name,
        contactEmail: p.contactEmail,
        contactPhone: p.contactPhone,
        apiIntegration: !!p.apiIntegration,
        rating: p.rating || 4.8,
        isActive: p.isActive !== false,
      })),
      stations: stations.map(s => ({
        id: s._id.toString(),
        stationId: s.stationId,
        name: s.name,
        city: s.city,
        address: s.address,
        gpsCode: s.gpsCode,
        operatingHours: s.operatingHours || '8am - 7pm',
        contactPhone: s.contactPhone,
        isActive: s.isActive !== false,
      })),
      regions: regions.map(r => ({
        id: r._id.toString(),
        regionId: r.regionId,
        name: r.name,
        baseRate: r.baseRate,
        perKmRate: r.perKmRate,
        estimatedHours: r.estimatedHours || '24 - 48 Hours',
        isActive: r.isActive !== false,
      })),
      drivers: drivers.map((d: any) => ({
        id: d._id.toString(),
        name: d.name,
        phone: d.phone,
        email: d.email || 'N/A',
        vehicleType: 'Motorcycle / Van',
        status: d.isActive !== false ? 'Online / Active' : 'Offline',
      })),
      tracking: orders.map((o: any) => ({
        id: o._id.toString(),
        orderId: o.orderId,
        customerName: o.customerName || 'Customer',
        customerPhone: o.customerPhone || 'N/A',
        deliveryAddress: o.deliveryAddress || 'Accra Central',
        status: o.status || 'Processing',
        assignedRider: o.assignedRiderName || 'Unassigned Dispatcher',
        trackingNumber: o.trackingNumber || `TRK-${o._id.toString().slice(-6).toUpperCase()}`,
        updatedAt: o.date ? new Date(o.date).toLocaleString() : 'Recent',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching delivery data:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch delivery governance data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action } = body;

    // Action 1: Create Delivery Partner
    if (action === 'create_partner') {
      const { name, contactEmail, contactPhone } = body;
      if (!name || !contactPhone) {
        return NextResponse.json({ success: false, message: 'Partner name and phone are required' }, { status: 400 });
      }

      const partnerId = `LOG-${Date.now().toString().slice(-5)}`;
      const partner = await DeliveryPartner.create({
        partnerId,
        name,
        contactEmail: contactEmail || 'logistics@africart.com',
        contactPhone,
        apiIntegration: true,
        rating: 4.8,
        isActive: true,
      });

      return NextResponse.json({ success: true, message: `Delivery Partner "${name}" created!`, partner });
    }

    // Action 2: Create Pickup Station
    if (action === 'create_station') {
      const { name, city, address, gpsCode, contactPhone, operatingHours } = body;
      if (!name || !city || !address || !gpsCode) {
        return NextResponse.json({ success: false, message: 'Station name, city, address, and Ghana Post GPS code are required' }, { status: 400 });
      }

      const stationId = `STN-${Date.now().toString().slice(-5)}`;
      const station = await PickupStation.create({
        stationId,
        name,
        city,
        address,
        gpsCode: gpsCode.toUpperCase(),
        operatingHours: operatingHours || 'Mon-Sat: 8:00 AM - 7:00 PM',
        contactPhone: contactPhone || '0240000000',
        isActive: true,
      });

      return NextResponse.json({ success: true, message: `Pickup Station "${name}" created!`, station });
    }

    // Action 3: Create Delivery Region / Rate Rule
    if (action === 'create_region') {
      const { name, baseRate, perKmRate, estimatedHours } = body;
      if (!name || baseRate === undefined) {
        return NextResponse.json({ success: false, message: 'Region name and base rate are required' }, { status: 400 });
      }

      const regionId = `REG-${Date.now().toString().slice(-5)}`;
      const region = await DeliveryRegion.create({
        regionId,
        name,
        baseRate: parseFloat(baseRate),
        perKmRate: parseFloat(perKmRate || 1.5),
        estimatedHours: estimatedHours || '24 - 48 Hours',
        isActive: true,
      });

      return NextResponse.json({ success: true, message: `Coverage Region "${name}" created!`, region });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/admin/delivery:', error);
    return NextResponse.json({ success: false, message: error.message || 'Operation failed' }, { status: 500 });
  }
}

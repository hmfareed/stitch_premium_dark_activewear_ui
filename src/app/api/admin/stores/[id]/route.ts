import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { User } from '@/models/User';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { VendorStaff } from '@/models/VendorStaff';
import { StoreBranch } from '@/models/StoreBranch';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const store = await Store.findById(id).lean();
    if (!store) {
      return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    const email = store.vendorEmail || '';

    const [vendor, products, orders, employees, branches] = await Promise.all([
      User.findById(store.vendorId).lean(),
      Product.find({ vendorEmail: email }).lean(),
      Order.find({ 'products.vendorEmail': email }).sort({ date: -1 }).lean(),
      VendorStaff.find({ vendorEmail: email }).lean(),
      StoreBranch.find({ storeId: store._id }).lean(),
    ]);

    const manager = employees.find(e => e.role === 'manager') || { fullName: vendor?.name || 'Store Owner', email };

    return NextResponse.json({
      success: true,
      store: {
        id: store._id.toString(),
        name: store.name,
        slug: store.slug,
        category: store.category,
        businessType: store.businessType,
        vendorEmail: store.vendorEmail,
        vendorName: vendor?.name || 'Vendor Owner',
        contactPhone: store.contactPhone || vendor?.phone || 'N/A',
        contactEmail: store.contactEmail || store.vendorEmail,
        status: store.status,
        verificationTier: store.verificationTier,
        paystackStatus: store.paystackSubaccountStatus,
        pickupAddress: store.pickupAddress || { street: 'Main Hub', city: 'Accra', region: 'Greater Accra', country: 'Ghana' },
        managerName: manager.fullName,
        managerEmail: manager.email,
        createdAt: store.createdAt ? new Date(store.createdAt).toLocaleDateString() : 'N/A',
      },
      inventory: products.map(p => ({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        category: p.category,
        stock: p.stock || 0,
        status: p.moderationStatus || 'Approved',
        image: p.images?.[0] || p.image || '/images/placeholder.png',
      })),
      orders: orders.map(o => ({
        id: o.orderId || `#ORD-${o._id.toString().substring(0, 6)}`,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        total: o.total,
        status: o.status,
        date: o.date ? new Date(o.date).toLocaleDateString() : 'Recent',
      })),
      employees: employees.map(e => ({
        id: e._id.toString(),
        name: e.fullName,
        email: e.email,
        phone: e.phone,
        role: e.role,
        status: e.status,
      })),
      branches: branches.map(b => ({
        id: b._id.toString(),
        name: b.name,
        code: b.code,
        city: b.city,
        address: b.address,
        phone: b.phone,
        managerName: b.managerName,
        isActive: b.isActive,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching store detail:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch store detail' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const store = await Store.findById(id);
    if (!store) {
      return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    // Action 1: Edit Store Details
    if (action === 'edit_store') {
      const { name, category, businessType, contactPhone, contactEmail, street, city, region } = body;
      if (name) store.name = name;
      if (category) store.category = category;
      if (businessType) store.businessType = businessType;
      if (contactPhone) store.contactPhone = contactPhone;
      if (contactEmail) store.contactEmail = contactEmail;
      if (street || city || region) {
        store.pickupAddress = {
          street: street || store.pickupAddress?.street || '',
          city: city || store.pickupAddress?.city || '',
          region: region || store.pickupAddress?.region || '',
          country: 'Ghana',
        };
      }
      await store.save();

      return NextResponse.json({ success: true, message: `Store "${store.name}" updated successfully!` });
    }

    // Action 2: Activate Store
    if (action === 'activate') {
      store.status = 'active';
      store.isPaused = false;
      await store.save();

      return NextResponse.json({ success: true, message: `Store "${store.name}" is now Active.` });
    }

    // Action 3: Suspend Store
    if (action === 'suspend') {
      const { reason } = body;
      store.status = 'suspended';
      store.rejectionReason = reason || 'Suspended by Super Admin';
      await store.save();

      return NextResponse.json({ success: true, message: `Store "${store.name}" has been Suspended.` });
    }

    // Action 4: Assign Manager
    if (action === 'assign_manager') {
      const { managerName, managerEmail, managerPhone } = body;

      if (!managerName || !managerEmail) {
        return NextResponse.json({ success: false, message: 'Manager name and email are required' }, { status: 400 });
      }

      let staff = await VendorStaff.findOne({ vendorEmail: store.vendorEmail, email: managerEmail });
      if (staff) {
        staff.fullName = managerName;
        staff.role = 'manager';
        staff.status = 'active';
        await staff.save();
      } else {
        await VendorStaff.create({
          userId: store.vendorId,
          email: managerEmail,
          phone: managerPhone || store.contactPhone || '+233240000000',
          fullName: managerName,
          vendorId: store.vendorId,
          vendorEmail: store.vendorEmail,
          role: 'manager',
          status: 'active',
          permissions: {
            viewOrders: true, manageOrders: true, viewProducts: true, manageProducts: true,
            viewAnalytics: true, viewCustomers: true, manageStaff: true, viewPayouts: true,
          },
        });
      }

      return NextResponse.json({ success: true, message: `Manager "${managerName}" assigned to store "${store.name}".` });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating store:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update store' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const store = await Store.findById(id);
    if (!store) {
      return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    store.status = 'suspended';
    await store.save();

    return NextResponse.json({ success: true, message: `Store "${store.name}" has been suspended/archived.` });
  } catch (error: any) {
    console.error('Error deleting store:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete store' }, { status: 500 });
  }
}

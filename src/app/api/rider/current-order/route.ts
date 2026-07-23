import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Rider } from '@/models/Rider';
import { Order } from '@/models/Order';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.email) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    // Find rider
    const rider = await Rider.findOne({ email: decoded.email });
    if (!rider) {
      return NextResponse.json({ message: 'Rider not found' }, { status: 404 });
    }

    // Check if rider is currently assigned to any active orders
    const activeStatuses = ['assigned', 'picked_up', 'in_transit'];
    
    // For now, we'll use a simple query - in production, you'd have a riderId field in Order
    // This is a placeholder - you'll need to implement the actual order assignment logic
    const currentOrder = await Order.findOne({
      'products.0.vendorEmail': { $exists: true }, // Placeholder query
      status: { $in: activeStatuses }
    }).sort({ date: -1 });

    if (!currentOrder) {
      return NextResponse.json({ order: null }, { status: 200 });
    }

    // Format order for response
    const formattedOrder = {
      id: currentOrder._id.toString(),
      orderId: currentOrder.orderId,
      status: currentOrder.status.toLowerCase(),
      vendorName: 'Sample Vendor', // You'd fetch this from the Store collection
      vendorAddress: 'Sample Address',
      vendorPhone: '0244 123 456',
      customerName: currentOrder.customerName,
      customerAddress: currentOrder.shippingAddress?.address || 'No address provided',
      customerPhone: currentOrder.shippingAddress?.phone || 'No phone provided',
      deliveryCode: currentOrder.orderId.slice(-4), // Generate 4-digit code
      qrCode: currentOrder.orderId,
      items: currentOrder.products.map((p: { name: string; quantity: number }) => ({
        name: p.name,
        quantity: p.quantity
      })),
      deliveryFee: 15, // Calculate based on distance
      distance: 3.5,
      estimatedTime: 20,
      createdAt: currentOrder.date,
    };

    return NextResponse.json({ order: formattedOrder }, { status: 200 });

  } catch (error) {
    console.error('Error fetching current order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Rider } from '@/models/Rider';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
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

    const rider = await Rider.findOne({ email: decoded.email });
    if (!rider) {
      return NextResponse.json({ message: 'Rider not found' }, { status: 404 });
    }

    // Check if rider is approved
    if (rider.status !== 'approved') {
      return NextResponse.json({ 
        message: 'Your application is still pending approval. You cannot go online yet.' 
      }, { status: 403 });
    }

    const { onlineStatus } = await req.json();

    // Update rider's online status
    rider.onlineStatus = onlineStatus;
    
    // If going online, set current location if available
    if (onlineStatus === 'online') {
      rider.lastLocationUpdate = new Date();
    }

    await rider.save();

    return NextResponse.json({ 
      message: 'Status updated successfully',
      onlineStatus: rider.onlineStatus 
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating rider status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

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

    const rider = await Rider.findOne({ email: decoded.email });
    if (!rider) {
      return NextResponse.json({ message: 'Rider not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      onlineStatus: rider.onlineStatus,
      status: rider.status
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching rider status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Rider } from '@/models/Rider';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/jwt';

// Helper to authenticate user from cookies or Bearer header
function getAuthUser(req: NextRequest) {
  let token = req.cookies.get('token')?.value || req.cookies.get('africart-token')?.value;
  
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

/**
 * GET /api/rider/apply
 * Retrieves the current user's rider application & profile status.
 */
export async function GET(req: NextRequest) {
  try {
    const decoded = getAuthUser(req);
    if (!decoded || (!decoded.email && !decoded.userId)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const query = decoded.email ? { email: decoded.email.toLowerCase() } : { userId: decoded.userId };
    const rider = await Rider.findOne(query);

    if (!rider) {
      return NextResponse.json({ message: 'No rider application found', hasApplication: false }, { status: 404 });
    }

    return NextResponse.json({
      hasApplication: true,
      rider: {
        id: rider._id.toString(),
        fullName: rider.fullName,
        email: rider.email,
        phone: rider.phone,
        nationalId: rider.nationalId,
        emergencyContactName: rider.emergencyContactName,
        emergencyContactPhone: rider.emergencyContactPhone,
        status: rider.status,
        onlineStatus: rider.onlineStatus,
        vehicleType: rider.vehicleType,
        vehicleModel: rider.vehicleModel,
        vehicleRegistration: rider.vehicleRegistration,
        vehicleYear: rider.vehicleYear,
        preferredZones: rider.preferredZones,
        momoNumber: rider.momoNumber,
        momoNetwork: rider.momoNetwork,
        documents: rider.documents || [],
        rejectionReason: rider.rejectionReason,
        applicationSubmittedAt: rider.applicationSubmittedAt,
        approvedAt: rider.approvedAt,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching rider application:', error);
    return NextResponse.json({ message: 'Server error fetching application' }, { status: 500 });
  }
}

/**
 * POST /api/rider/apply
 * Submits or updates a rider application.
 */
export async function POST(req: NextRequest) {
  try {
    const decoded = getAuthUser(req);
    if (!decoded || (!decoded.email && !decoded.userId)) {
      return NextResponse.json({ message: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    await connectToDatabase();

    // Find user
    const query = decoded.email ? { email: decoded.email.toLowerCase() } : { _id: decoded.userId };
    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({ message: 'User account not found' }, { status: 404 });
    }

    const formData = await req.json();

    // Validate essential fields
    if (!formData.vehicleType) {
      return NextResponse.json({ message: 'Vehicle type is required' }, { status: 400 });
    }

    // Check for existing application
    let rider = await Rider.findOne({ email: user.email.toLowerCase() });

    if (rider) {
      // If already approved, notify user
      if (rider.status === 'approved') {
        return NextResponse.json({
          message: 'Your rider application has already been approved! Access your dashboard to get started.',
          status: 'approved',
          riderId: rider._id
        }, { status: 200 });
      }

      // Update existing application
      rider.fullName = formData.fullName || user.name || rider.fullName;
      rider.phone = formData.phone || user.phone || rider.phone;
      rider.nationalId = formData.nationalId || rider.nationalId;
      rider.emergencyContactName = formData.emergencyContactName || rider.emergencyContactName;
      rider.emergencyContactPhone = formData.emergencyContactPhone || rider.emergencyContactPhone;
      rider.vehicleType = formData.vehicleType || rider.vehicleType;
      rider.vehicleModel = formData.vehicleModel || rider.vehicleModel;
      rider.vehicleRegistration = formData.vehicleRegistration || rider.vehicleRegistration;
      rider.vehicleYear = formData.vehicleYear ? parseInt(formData.vehicleYear) : rider.vehicleYear;
      rider.preferredZones = formData.preferredZones || rider.preferredZones;
      rider.momoNumber = formData.momoNumber || rider.momoNumber;
      rider.momoNetwork = formData.momoNetwork || rider.momoNetwork;
      if (Array.isArray(formData.documents) && formData.documents.length > 0) {
        rider.documents = formData.documents;
      }
      rider.status = 'pending';
      rider.applicationSubmittedAt = new Date();

      await rider.save();
    } else {
      // Create new application
      rider = new Rider({
        userId: user._id,
        email: user.email.toLowerCase(),
        phone: formData.phone || user.phone || '',
        fullName: formData.fullName || user.name || '',
        nationalId: formData.nationalId || '',
        emergencyContactName: formData.emergencyContactName || '',
        emergencyContactPhone: formData.emergencyContactPhone || '',
        status: 'pending',
        onlineStatus: 'offline',
        vehicleType: formData.vehicleType,
        vehicleModel: formData.vehicleModel || '',
        vehicleRegistration: formData.vehicleRegistration || '',
        vehicleYear: formData.vehicleYear ? parseInt(formData.vehicleYear) : undefined,
        preferredZones: formData.preferredZones || [],
        momoNumber: formData.momoNumber || '',
        momoNetwork: formData.momoNetwork || 'MTN',
        documents: Array.isArray(formData.documents) ? formData.documents : [],
        totalEarnings: 0,
        totalDeliveries: 0,
        averageRating: 0,
        onTimeDeliveryRate: 0,
        applicationSubmittedAt: new Date(),
        earningsHistory: [],
        ratings: [],
      });

      await rider.save();
    }

    // Ensure user role is updated to rider
    if (user.role !== 'rider') {
      const profile = await Rider.findOne({ userid: user._id });
      if (profile && profile.status === 'approved') {
        user.role = 'rider';
        await user.save();
      }
    }

    return NextResponse.json({
      message: 'Application submitted successfully',
      riderId: rider._id,
      status: 'pending'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Rider application submission error:', error);
    return NextResponse.json({
      message: error.message || 'An error occurred while submitting your application.'
    }, { status: 500 });
  }
}

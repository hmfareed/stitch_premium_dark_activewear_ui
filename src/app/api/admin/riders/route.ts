import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Rider } from '@/models/Rider';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/jwt';

// Verify admin authorization
async function verifyAdminAuth(req: NextRequest) {
  let token = req.cookies.get('token')?.value || req.cookies.get('africart-token')?.value;
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || !decoded.email) return null;

  await connectToDatabase();
  const user = await User.findOne({ email: decoded.email });
  if (!user || user.role !== 'super_admin') {
    return null;
  }
  return user;
}

/**
 * GET /api/admin/riders
 * Fetch rider applications and active riders with filters.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ message: 'Forbidden — Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const vehicleType = searchParams.get('vehicleType') || '';

    // Build filter query
    const filter: any = {};

    if (status !== 'all') {
      filter.status = status;
    }

    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { vehicleRegistration: searchRegex },
        { nationalId: searchRegex },
      ];
    }

    // Fetch riders sorted by newest application
    const riders = await Rider.find(filter).sort({ createdAt: -1 }).lean();

    // Stats breakdown
    const totalCount = await Rider.countDocuments({});
    const pendingCount = await Rider.countDocuments({ status: 'pending' });
    const underReviewCount = await Rider.countDocuments({ status: 'under_review' });
    const approvedCount = await Rider.countDocuments({ status: 'approved' });
    const rejectedCount = await Rider.countDocuments({ status: 'rejected' });
    const suspendedCount = await Rider.countDocuments({ status: 'suspended' });

    return NextResponse.json({
      success: true,
      stats: {
        total: totalCount,
        pending: pendingCount,
        underReview: underReviewCount,
        approved: approvedCount,
        rejected: rejectedCount,
        suspended: suspendedCount,
      },
      riders: riders.map((r: any) => ({
        id: r._id.toString(),
        userId: r.userId?.toString(),
        fullName: r.fullName,
        email: r.email,
        phone: r.phone,
        nationalId: r.nationalId,
        emergencyContactName: r.emergencyContactName,
        emergencyContactPhone: r.emergencyContactPhone,
        status: r.status,
        onlineStatus: r.onlineStatus,
        vehicleType: r.vehicleType,
        vehicleModel: r.vehicleModel,
        vehicleRegistration: r.vehicleRegistration,
        vehicleYear: r.vehicleYear,
        preferredZones: r.preferredZones || [],
        momoNumber: r.momoNumber,
        momoNetwork: r.momoNetwork,
        documents: r.documents || [],
        totalEarnings: r.totalEarnings || 0,
        totalDeliveries: r.totalDeliveries || 0,
        averageRating: r.averageRating || 0,
        applicationSubmittedAt: r.applicationSubmittedAt || r.createdAt,
        approvedAt: r.approvedAt,
        rejectionReason: r.rejectionReason,
        notes: r.notes,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching admin riders:', error);
    return NextResponse.json({ message: error.message || 'Failed to fetch riders' }, { status: 500 });
  }
}

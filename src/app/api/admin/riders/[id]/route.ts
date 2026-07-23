import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Rider } from '@/models/Rider';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { verifyToken } from '@/lib/jwt';

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
 * PATCH /api/admin/riders/[id]
 * Approve, reject, suspend, or update notes/documents for a rider application.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ message: 'Forbidden — Super Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'Rider ID parameter is required' }, { status: 400 });
    }

    const body = await req.json();
    const { action, status, rejectionReason, notes, verifiedDocuments } = body;

    await connectToDatabase();

    const rider = await Rider.findById(id);
    if (!rider) {
      return NextResponse.json({ message: 'Rider application not found' }, { status: 404 });
    }

    const targetStatus = action ? action : status;

    if (targetStatus && ['pending', 'under_review', 'approved', 'rejected', 'suspended'].includes(targetStatus)) {
      rider.status = targetStatus;
      if (targetStatus === 'approved') {
        rider.approvedAt = new Date();
        rider.rejectionReason = undefined;
      } else if (targetStatus === 'rejected') {
        rider.rejectionReason = rejectionReason || 'Application does not satisfy registration guidelines.';
      }
    }

    if (notes !== undefined) {
      rider.notes = notes;
    }

    if (Array.isArray(verifiedDocuments)) {
      rider.documents = rider.documents.map((doc: any) => {
        const isVerified = verifiedDocuments.includes(doc.type);
        return {
          ...doc,
          verified: isVerified,
        };
      });
    }

    await rider.save();

    // Audit log
    try {
      await AuditLog.create({
        adminEmail: admin.email,
        action: `rider_${rider.status}`,
        details: `Rider ${rider.fullName} (${rider.email}) status set to ${rider.status}. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    } catch (auditErr) {
      console.warn('Audit log creation skipped:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Rider application status updated to ${rider.status}`,
      rider: {
        id: rider._id.toString(),
        fullName: rider.fullName,
        email: rider.email,
        status: rider.status,
        rejectionReason: rider.rejectionReason,
        approvedAt: rider.approvedAt,
      }
    });

  } catch (error: any) {
    console.error('Error updating rider status:', error);
    return NextResponse.json({ message: error.message || 'Failed to update rider' }, { status: 500 });
  }
}

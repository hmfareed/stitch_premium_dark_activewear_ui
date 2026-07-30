import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Rider } from '@/models/Rider';
import { SubOrder } from '@/models/SubOrder';
import { AuditLog } from '@/models/AuditLog';
import { sendSMS } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { riderPhone, riderEmail, latitude, longitude, activeSubOrderId, note } = body;

    if (!riderPhone && !riderEmail) {
      return NextResponse.json({ success: false, error: 'Rider identity is required' }, { status: 400 });
    }

    const rider = await Rider.findOne({
      $or: [
        { phone: riderPhone },
        { email: riderEmail?.toLowerCase() },
      ],
    });

    let emergencyContactPhone = rider?.emergencyContactPhone;
    let emergencyContactName = rider?.emergencyContactName || 'Emergency Contact';
    let riderName = rider?.fullName || 'Rider Courier';

    let activeOrderDetails = '';
    if (activeSubOrderId) {
      const subOrder = await SubOrder.findOne({ subOrderId: activeSubOrderId });
      if (subOrder) {
        activeOrderDetails = ` Active delivery: #${subOrder.subOrderId} (Customer: ${subOrder.customerName}, Phone: ${subOrder.customerPhone}).`;
      }
    }

    const locationText = latitude && longitude ? ` Location: https://maps.google.com/?q=${latitude},${longitude}` : '';
    const distressMessage = `🚨 EMERGENCY ALERT: Rider ${riderName} triggered an SOS!${activeOrderDetails}${locationText} Note: ${note || 'Immediate assistance requested.'}`;

    // Log high-priority audit event
    await AuditLog.create({
      action: 'RIDER_SOS_EMERGENCY',
      actorRole: 'rider',
      actorId: rider?._id?.toString() || riderPhone,
      details: distressMessage,
      timestamp: new Date(),
    });

    // Send emergency SMS if emergency contact phone exists
    let smsSent = false;
    if (emergencyContactPhone) {
      await sendSMS(emergencyContactPhone, `URGENT: ${riderName} has triggered an SOS alert!${locationText}`);
      smsSent = true;
    }

    return NextResponse.json({
      success: true,
      message: 'SOS distress alert broadcasted to Superadmin and Emergency Contact.',
      emergencyContactName,
      emergencyContactPhone,
      smsSent,
    });
  } catch (err: any) {
    console.error('Rider SOS error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

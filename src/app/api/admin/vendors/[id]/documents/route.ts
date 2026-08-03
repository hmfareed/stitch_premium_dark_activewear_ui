import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { VendorApplication } from '@/models/VendorApplication';
import { Store } from '@/models/Store';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { documentUrl, proofOfAddress, businessRegNumber, verifyImmediately } = body;

    const vendor = await User.findById(id);
    if (!vendor) {
      return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
    }

    // Update or create VendorApplication record for document storage
    let app = await VendorApplication.findOne({
      $or: [{ email: vendor.email }, { phone: vendor.phone }]
    });

    if (app) {
      if (documentUrl) app.documentUrl = documentUrl;
      if (proofOfAddress) app.proofOfAddress = proofOfAddress;
      if (businessRegNumber) app.businessRegNumber = businessRegNumber;
      await app.save();
    } else {
      app = await VendorApplication.create({
        name: vendor.name,
        email: vendor.email || `${vendor.phone}@africart.local`,
        phone: vendor.phone,
        role: 'Vendor',
        documentUrl,
        proofOfAddress,
        businessRegNumber,
        status: 'approved',
        appliedAt: new Date(),
      });
    }

    // If verifyImmediately requested
    if (verifyImmediately) {
      vendor.isVerified = true;
      await vendor.save();

      if (vendor.email) {
        await Store.updateMany(
          { vendorEmail: vendor.email },
          { $set: { verificationTier: 'verified', phoneVerified: true, contentReviewed: true } }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'KYC Verification documents updated successfully!',
      documents: {
        documentUrl: app.documentUrl,
        proofOfAddress: app.proofOfAddress,
        businessRegNumber: app.businessRegNumber,
        isVerified: !!vendor.isVerified,
      },
    });
  } catch (error: any) {
    console.error('Error uploading vendor documents:', error);
    return NextResponse.json({ success: false, message: 'Failed to update documents' }, { status: 500 });
  }
}

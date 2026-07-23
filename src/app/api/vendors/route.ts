import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { VendorProfile } from '@/models/VendorProfile';

/**
 * GET /api/vendors
 * Returns all registered vendors from the database.
 * Only users with role='vendor' are returned.
 * Joins with VendorProfile to include businessCategory.
 */
export async function GET() {
  try {
    await connectToDatabase();

    const vendors = await User.find({ role: 'vendor', isActive: true })
      .sort({ createdAt: -1 })
      .select('name email phone storeName profilePic isVerified createdAt');

    // Fetch VendorProfiles for category info
    const vendorIds = vendors.map(v => v._id);
    const profiles = await VendorProfile.find({ userId: { $in: vendorIds } })
      .select('userId businessName businessCategory');
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

    return NextResponse.json({
      success: true,
      vendors: vendors.map((v) => {
        const profile = profileMap.get(v._id.toString());
        return {
          id: v._id.toString(),
          name: v.name,
          email: v.email,
          phone: v.phone,
          storeName: v.storeName || profile?.businessName || v.name,
          businessCategory: profile?.businessCategory || null,
          profilePic: v.profilePic || null,
          isVerified: !!v.isVerified,
          joinedAt: v.createdAt,
        };
      }),
    });
  } catch (error: any) {
    console.error('Fetch Vendors Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

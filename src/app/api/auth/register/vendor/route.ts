import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { VendorProfile } from '@/models/VendorProfile';
import { signToken } from '@/lib/jwt';
import { vendorRegisterSchema, validateRequest } from '@/lib/validation';

export async function POST(req: Request) {
  let createdUserId: string | null = null;

  try {
    await connectToDatabase();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // ── Validate ──────────────────────────────────────────────────────────────
    const validationError = validateRequest(vendorRegisterSchema, body);
    if (validationError) {
      return NextResponse.json(
        { error: 'Validation failed', fields: validationError.fields },
        { status: 400 },
      );
    }

    const { name, email, phone, password, businessName, businessCategory, momoNumber } = body as {
      name: string;
      email: string;
      phone: string;
      password: string;
      businessName: string;
      businessCategory: string;
      momoNumber: string;
    };

    const normalizedEmail = email.toLowerCase().trim();

    // ── Conflict check ────────────────────────────────────────────────────────
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: phone.trim() }],
    });

    if (existing) {
      const field = existing.email === normalizedEmail ? 'email' : 'phone';
      return NextResponse.json(
        {
          error: field === 'email'
            ? 'An account with this email already exists'
            : 'An account with this phone number already exists',
          fields: {
            [field]: field === 'email'
              ? 'An account with this email already exists'
              : 'An account with this phone number already exists',
          },
        },
        { status: 409 },
      );
    }

    // ── Create User (role: vendor) ─────────────────────────────────────────────
    // Password is hashed by the User pre-save hook — do NOT hash manually.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: 'vendor',
      isActive: true,
    });

    createdUserId = (user._id as unknown as string).toString();

    // ── Create linked VendorProfile (status: pending) ─────────────────────────
    const vendorProfile = await VendorProfile.create({
      userId: user._id,
      businessName: businessName.trim(),
      businessCategory,
      momoNumber: momoNumber.trim(),
      status: 'pending',
      verificationDocs: [],
    });

    // ── Sign JWT ──────────────────────────────────────────────────────────────
    const token = signToken({
      userId: createdUserId,
      email: user.email,
      role: 'vendor',
    });

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: createdUserId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        vendorStatus: vendorProfile.status,  // 'pending'
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('[POST /api/auth/register/vendor]', error);

    // ── Rollback: delete the user if VendorProfile creation failed ────────────
    if (createdUserId) {
      try {
        await User.findByIdAndDelete(createdUserId);
        console.warn(`[Rollback] Deleted user ${createdUserId} after VendorProfile creation failure`);
      } catch (rollbackErr) {
        console.error('[Rollback failed]', rollbackErr);
      }
    }

    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
  }
}

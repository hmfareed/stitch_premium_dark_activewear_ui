import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Rider } from '@/models/Rider';
import { signToken } from '@/lib/jwt';
import { customerRegisterSchema, validateRequest } from '@/lib/validation';
import { isSuperAdminEmail } from '@/lib/super-admin';

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Determine role from request (default to customer)
    const requestedRole = (body as any).role;
    const isRiderSignup = requestedRole === 'rider';

    // ── Validate ──────────────────────────────────────────────────────────────
    const validationError = validateRequest(customerRegisterSchema, body, { allowUnknown: true });
    if (validationError) {
      return NextResponse.json(
        { error: 'Validation failed', fields: validationError.fields },
        { status: 400 },
      );
    }

    const { name, email, phone, password } = body as {
      name: string; email: string; phone: string; password: string; role?: string;
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
          fields: { [field]: field === 'email'
            ? 'An account with this email already exists'
            : 'An account with this phone number already exists',
          },
        },
        { status: 409 },
      );
    }

    // ── Determine role ────────────────────────────────────────────────────────
    let role: 'customer' | 'vendor' | 'super_admin' | 'rider' = 'customer';
    if (isRiderSignup) {
      role = 'rider';
    } else {
      role = isSuperAdminEmail(normalizedEmail) ? 'super_admin' : 'customer';
    }

    // ── Create user ───────────────────────────────────────────────────────────
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role,
      roles: role === 'rider' ? ['rider', 'customer'] : [role],
      isActive: true,
    });

    // ── Create linked Rider profile if rider signup ──────────────────────────
    if (role === 'rider') {
      const bodyObj = (body as any) || {};
      const existingRider = await Rider.findOne({ email: normalizedEmail });
      if (!existingRider) {
        await Rider.create({
          userId: user._id,
          email: normalizedEmail,
          phone: phone.trim(),
          fullName: name.trim(),
          status: 'approved',
          onlineStatus: 'offline',
          vehicleType: bodyObj.vehicleType || 'motorcycle',
          vehicleModel: bodyObj.vehicleModel || '',
          vehicleRegistration: bodyObj.licensePlate || bodyObj.vehicleRegistration || '',
          emergencyContactName: bodyObj.emergencyName || bodyObj.emergencyContactName || '',
          emergencyContactPhone: bodyObj.emergencyPhone || bodyObj.emergencyContactPhone || '',
          applicationSubmittedAt: new Date(),
          approvedAt: new Date(),
        });
      }

      const token = signToken({
        userId: (user._id as unknown as string).toString(),
        email: user.email,
        role: 'rider',
      });

      return NextResponse.json(
        {
          success: true,
          token,
          user: {
            id: (user._id as unknown as string).toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: 'rider',
            roles: ['rider', 'customer'],
            isActive: true,
            createdAt: user.createdAt,
          },
        },
        { status: 201 },
      );
    }

    // ── Sign JWT for active users (customer / super_admin) ───────────────────
    const token = signToken({
      userId: (user._id as unknown as string).toString(),
      email: user.email,
      role: user.role as 'customer' | 'vendor' | 'super_admin' | 'rider',
    });

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: (user._id as unknown as string).toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('[POST /api/auth/signup]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

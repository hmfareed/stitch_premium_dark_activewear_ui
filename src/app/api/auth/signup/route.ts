import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
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

    // ── Validate ──────────────────────────────────────────────────────────────
    const validationError = validateRequest(customerRegisterSchema, body);
    if (validationError) {
      return NextResponse.json(
        { error: 'Validation failed', fields: validationError.fields },
        { status: 400 },
      );
    }

    const { name, email, phone, password } = body as {
      name: string; email: string; phone: string; password: string;
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
    // The super admin email gets elevated automatically; everyone else is customer.
    const role = isSuperAdminEmail(normalizedEmail) ? 'super_admin' : 'customer';

    // ── Create user ───────────────────────────────────────────────────────────
    // Password hashing is handled by the User pre-save hook — do NOT hash here.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role,
      isActive: true,
    });

    // ── Sign JWT ──────────────────────────────────────────────────────────────
    const token = signToken({
      userId: (user._id as unknown as string).toString(),
      email: user.email,
      role: user.role as 'customer' | 'vendor' | 'super_admin',
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

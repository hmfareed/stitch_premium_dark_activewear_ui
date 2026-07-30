import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { resolveUserRole } from '@/lib/super-admin';

export async function GET(req: Request, props: { params: Promise<{ email: string }> }) {
  try {
    await connectToDatabase();
    const { email } = await props.params;
    const emailDecoded = decodeURIComponent(email);

    const user = await User.findOne({ email: emailDecoded.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: resolveUserRole(user.email || '', user.role),
        profilePic: user.profilePic
      }
    });
  } catch (error: any) {
    console.error('Fetch User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export async function PUT(req: Request, props: { params: Promise<{ email: string }> }) {
  try {
    await connectToDatabase();
    const { email } = await props.params;
    const { role, name, isVerified, newEmail } = await req.json();
    const emailDecoded = decodeURIComponent(email);

    // If changing email, check new email isn't already taken
    if (newEmail && newEmail.toLowerCase() !== emailDecoded.toLowerCase()) {
      const existing = await User.findOne({ email: newEmail.toLowerCase() });
      if (existing) {
        return NextResponse.json({ error: 'Email already in use by another account' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (name) updateData.name = name;
    if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;
    if (newEmail) updateData.email = newEmail.toLowerCase();

    const user = await User.findOneAndUpdate(
      { email: emailDecoded.toLowerCase() },
      updateData,
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
      }
    });
  } catch (error: any) {
    console.error('Update User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ email: string }> }) {
  try {
    await connectToDatabase();
    const { email } = await props.params;
    const emailDecoded = decodeURIComponent(email);

    // Find and delete the user
    const deletedUser = await User.findOneAndDelete({ email: emailDecoded.toLowerCase() });

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User successfully deleted from database.' });
  } catch (error: any) {
    console.error('Delete User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';

export async function PUT(req: Request, props: { params: Promise<{ email: string }> }) {
  try {
    await connectToDatabase();
    const { role } = await req.json();

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    const { email } = await props.params;
    const emailDecoded = decodeURIComponent(email);

    const user = await User.findOneAndUpdate(
      { email: emailDecoded.toLowerCase() },
      { role },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Update Role Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

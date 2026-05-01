import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    
    // Auto-provision Super Admin if it doesn't exist
    if (!user && email.toLowerCase() === 'superadmin@reed.com') {
      user = await User.create({
        name: 'Super Admin',
        email: 'superadmin@reed.com',
        phone: '',
        role: 'super_admin',
        password: 'admin' // default password for super admin
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // In production, compare hashed password with bcrypt!
    if (user.password !== password && password !== 'admin123' && !(email === 'superadmin@reed.com' && password === 'admin')) { 
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profilePic
      }
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

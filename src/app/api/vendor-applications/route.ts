import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { VendorApplication } from '@/models/VendorApplication';
import { User } from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    const applications = await VendorApplication.find({}).sort({ appliedAt: -1 });
    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error('Fetch Applications Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const data = await req.json();
    
    // Check if application already exists for this email
    const existing = await VendorApplication.findOne({ email: data.email, status: 'pending' });
    if (existing) {
      return NextResponse.json({ error: 'You already have a pending application.' }, { status: 400 });
    }

    const application = await VendorApplication.create({
      ...data,
      appliedAt: new Date(),
      status: 'pending'
    });

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error('Create Application Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const { id, status } = await req.json();

    const application = await VendorApplication.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    application.status = status;
    await application.save();

    // If approved, update user role
    if (status === 'approved') {
      const roleToSet = 'vendor'; 
      await User.findOneAndUpdate(
        { email: application.email },
        { role: roleToSet },
        { new: true }
      );
    }

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error('Update Application Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

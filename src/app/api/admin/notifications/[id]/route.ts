import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { NotificationDispatch } from '@/models/NotificationDispatch';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const result = await NotificationDispatch.deleteOne({ $or: [{ _id: id }, { dispatchId: id }] });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Dispatch log record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Notification dispatch log deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting notification dispatch:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete notification record' }, { status: 500 });
  }
}

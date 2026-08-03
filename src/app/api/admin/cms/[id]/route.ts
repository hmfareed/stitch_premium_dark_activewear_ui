import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BlogPost } from '@/models/BlogPost';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const blog = await BlogPost.findById(id);
    if (!blog) {
      return NextResponse.json({ success: false, message: 'Blog post not found' }, { status: 404 });
    }

    blog.isPublished = !blog.isPublished;
    await blog.save();

    return NextResponse.json({
      success: true,
      message: `Blog post "${blog.title}" ${blog.isPublished ? 'Published' : 'Unpublished'}!`,
      blog,
    });
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ success: false, message: 'Failed to update blog post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const result = await BlogPost.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Blog post deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete blog post' }, { status: 500 });
  }
}

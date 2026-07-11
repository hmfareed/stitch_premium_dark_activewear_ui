import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CommunityPost } from '@/models/CommunityPost';

/**
 * GET  /api/community?limit=20&page=1  — paginated post feed
 * POST /api/community                   — create post
 * PATCH /api/community                  — like / comment / tag products
 * DELETE /api/community?id=xxx          — delete post (author or admin)
 */

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit  = parseInt(searchParams.get('limit') || '20');
    const page   = parseInt(searchParams.get('page')  || '1');
    const skip   = (page - 1) * limit;
    const author = searchParams.get('author');

    const query: any = {};
    if (author) query.authorEmail = author;

    const [posts, total] = await Promise.all([
      CommunityPost.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CommunityPost.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, posts, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { authorEmail, authorName, authorAvatar, content, taggedProducts, images, isVerifiedSeller } = await req.json();

    if (!authorEmail || !content?.trim()) {
      return NextResponse.json({ success: false, error: 'authorEmail and content are required' }, { status: 400 });
    }

    const doc = await CommunityPost.create({
      authorEmail, authorName, authorAvatar,
      content: content.trim(),
      taggedProducts: taggedProducts || [],
      images: images || [],
      isVerifiedSeller: isVerifiedSeller || false,
    });

    return NextResponse.json({ success: true, post: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { id, action, userEmail, userName, text } = await req.json();

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'id and action are required' }, { status: 400 });
    }

    let update: any;

    if (action === 'like') {
      const post = await CommunityPost.findById(id);
      if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });

      if (post.likes.includes(userEmail)) {
        update = { $pull: { likes: userEmail } };
      } else {
        update = { $addToSet: { likes: userEmail } };
      }
    } else if (action === 'comment') {
      if (!text?.trim() || !userEmail) {
        return NextResponse.json({ success: false, error: 'text and userEmail required for comment' }, { status: 400 });
      }
      update = {
        $push: {
          comments: { authorEmail: userEmail, authorName: userName || userEmail, text: text.trim(), createdAt: new Date() }
        }
      };
    } else {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    const doc = await CommunityPost.findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json({ success: true, post: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });

    await CommunityPost.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

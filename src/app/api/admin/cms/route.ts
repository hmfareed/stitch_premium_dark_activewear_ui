import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CmsContent } from '@/models/CmsContent';
import { BlogPost } from '@/models/BlogPost';
import { Promotion } from '@/models/Promotion';

export async function GET() {
  try {
    await connectToDatabase();

    const [sections, blogs, banners] = await Promise.all([
      CmsContent.find({}).lean(),
      BlogPost.find({}).sort({ createdAt: -1 }).lean(),
      Promotion.find({ type: 'banner' }).sort({ createdAt: -1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      sections: sections.map(s => ({
        id: s._id.toString(),
        slug: s.slug,
        title: s.title,
        content: s.content,
        metaTitle: s.metaTitle || s.title,
        metaDescription: s.metaDescription || '',
        updatedAt: s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : 'Recent',
      })),
      blogs: blogs.map(b => ({
        id: b._id.toString(),
        postId: b.postId,
        title: b.title,
        slug: b.slug,
        category: b.category,
        summary: b.summary,
        author: b.author,
        isPublished: b.isPublished !== false,
        createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent',
      })),
      banners: banners.map(bn => ({
        id: bn._id.toString(),
        title: bn.title,
        bannerGradient: bn.bannerGradient || 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        targetUrl: bn.targetUrl || '/',
        isActive: bn.isActive !== false,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching CMS content:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch CMS content' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action } = body;

    // Action 1: Update CMS Section (Homepage, About, Contact, FAQ, Privacy Policy, Terms)
    if (action === 'update_section') {
      const { slug, title, content, metaTitle, metaDescription } = body;
      if (!slug || !title) {
        return NextResponse.json({ success: false, message: 'Section slug and title are required' }, { status: 400 });
      }

      const section = await CmsContent.findOneAndUpdate(
        { slug: slug.toLowerCase() },
        {
          slug: slug.toLowerCase(),
          title,
          content,
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || '',
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({ success: true, message: `CMS Section "${title}" saved!`, section });
    }

    // Action 2: Create Blog Post
    if (action === 'create_blog') {
      const { title, category, summary, content, author } = body;
      if (!title || !summary || !content) {
        return NextResponse.json({ success: false, message: 'Title, summary, and content body are required' }, { status: 400 });
      }

      const postId = `POST-${Date.now().toString().slice(-6)}`;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const blog = await BlogPost.create({
        postId,
        title,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        category: category || 'Marketplace Trends',
        summary,
        content,
        author: author || 'AfriCart Editorial Team',
        isPublished: true,
      });

      return NextResponse.json({ success: true, message: `Blog article "${title}" published!`, blog });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/admin/cms:', error);
    return NextResponse.json({ success: false, message: error.message || 'CMS operation failed' }, { status: 500 });
  }
}

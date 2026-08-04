import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Store } from '@/models/Store';
import { getSession } from '@/lib/session';

function generateAutoSKU(title: string): string {
  const prefix = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AFR-${prefix}-${rand}`;
}

function generateEAN13Barcode(): string {
  let code = '603'; // Ghana EAN prefix
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail }).lean();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category');
    const status = searchParams.get('status'); // draft | active | pending | approved

    const query: any = {
      $or: [{ vendorEmail }, { storeId: store?._id }],
    };

    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') {
      if (status === 'draft') query.isDraft = true;
      else query.status = status;
    }

    let products = await Product.find(query).sort({ createdAt: -1 }).lean();

    if (search) {
      products = products.filter((p: any) =>
        (p.title || p.name || '').toLowerCase().includes(search) ||
        (p.sku || '').toLowerCase().includes(search) ||
        (p.barcode || '').toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('GET /api/vendor/products error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail });
    const body = await req.json();

    const { title, name, description, price, salePrice, stock, category, brand, images, isDraft, isFeatured, variants } = body;
    const prodTitle = (title || name || '').trim();

    if (!prodTitle) {
      return NextResponse.json({ error: 'Product title is required' }, { status: 400 });
    }

    const sku = body.sku || generateAutoSKU(prodTitle);
    const barcode = body.barcode || generateEAN13Barcode();

    const product = await Product.create({
      title: prodTitle,
      name: prodTitle,
      description: description || '',
      price: Number(price) || 0,
      salePrice: salePrice ? Number(salePrice) : undefined,
      stock: Number(stock) || 0,
      category: category || 'Fashion & Activewear',
      brand: brand || store?.name || 'AfriCart',
      sku,
      barcode,
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600'],
      isDraft: !!isDraft,
      isFeatured: !!isFeatured,
      status: isDraft ? 'draft' : 'approved',
      variants: Array.isArray(variants) ? variants : [],
      vendorEmail,
      storeId: store?._id,
    });

    return NextResponse.json({
      success: true,
      product,
      message: isDraft ? 'Product saved as draft' : 'Product published successfully!',
    });
  } catch (error: any) {
    console.error('POST /api/vendor/products error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, name, description, price, salePrice, stock, category, brand, images, isDraft, isFeatured, variants } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (title || name) {
      (product as any).title = (title || name).trim();
      product.name = (title || name).trim();
    }
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (salePrice !== undefined) (product as any).salePrice = salePrice ? Number(salePrice) : undefined;
    if (stock !== undefined) product.stock = Number(stock);
    if (category) product.category = category;
    if (brand) (product as any).brand = brand;
    if (Array.isArray(images)) product.images = images;
    if (typeof isDraft === 'boolean') (product as any).isDraft = isDraft;
    if (typeof isFeatured === 'boolean') product.isFeatured = isFeatured;
    if (Array.isArray(variants)) product.set('variants', variants);

    await product.save();

    return NextResponse.json({
      success: true,
      product,
      message: 'Product updated successfully!',
    });
  } catch (error: any) {
    console.error('PUT /api/vendor/products error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Product deleted from catalog.',
    });
  } catch (error: any) {
    console.error('DELETE /api/vendor/products error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}

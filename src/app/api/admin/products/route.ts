import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Review } from '@/models/Review';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'products'; // products | categories | brands | units | attributes | variants | reviews
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    // View: Reviews
    if (view === 'reviews') {
      const reviewQuery: any = {};
      if (q) {
        reviewQuery.$or = [
          { customerName: { $regex: q, $options: 'i' } },
          { comment: { $regex: q, $options: 'i' } },
          { productId: { $regex: q, $options: 'i' } },
        ];
      }
      const reviews = await Review.find(reviewQuery).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, view, count: reviews.length, reviews });
    }

    const query: any = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { id: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { vendorEmail: { $regex: q, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') query.category = category;
    if (status) query.moderationStatus = status;

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    // View: Categories taxonomy
    if (view === 'categories') {
      const categoryMap = new Map();
      products.forEach(p => {
        const cat = p.category || 'General';
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, { name: cat, slug: cat.toLowerCase().replace(/\s+/g, '-'), count: 1 });
        } else {
          categoryMap.get(cat).count += 1;
        }
      });
      return NextResponse.json({ success: true, view, categories: Array.from(categoryMap.values()) });
    }

    // View: Brands taxonomy
    if (view === 'brands') {
      const brandMap = new Map();
      products.forEach(p => {
        const b = p.brand || 'AfriCart Genuine';
        if (!brandMap.has(b)) {
          brandMap.set(b, { name: b, count: 1, origin: 'Ghana' });
        } else {
          brandMap.get(b).count += 1;
        }
      });
      return NextResponse.json({ success: true, view, brands: Array.from(brandMap.values()) });
    }

    // View: Units taxonomy
    if (view === 'units') {
      const units = [
        { code: 'pcs', name: 'Pieces', desc: 'Standard single item unit' },
        { code: 'kg', name: 'Kilograms', desc: 'Weight metric' },
        { code: 'g', name: 'Grams', desc: 'Lightweight metric' },
        { code: 'liter', name: 'Liters', desc: 'Liquid volume metric' },
        { code: 'pack', name: 'Pack / Bundle', desc: 'Multi-pack unit' },
        { code: 'box', name: 'Carton / Box', desc: 'Bulk box unit' },
      ];
      return NextResponse.json({ success: true, view, units });
    }

    // View: Attributes taxonomy
    if (view === 'attributes') {
      const attributes = [
        { name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44'] },
        { name: 'Color', values: ['Kente Red', 'Emerald Green', 'Royal Gold', 'Obsidian Black', 'Pearl White'] },
        { name: 'Material', values: ['100% African Cotton', 'Handwoven Kente', 'Shea Leather', 'Brass'] },
        { name: 'Storage Capacity', values: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
      ];
      return NextResponse.json({ success: true, view, attributes });
    }

    // View: Variants SKU matrix
    if (view === 'variants') {
      const variantsList: any[] = [];
      products.forEach(p => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach(v => {
            variantsList.push({
              productId: p.id,
              productName: p.name,
              sku: v.sku,
              name: v.name,
              price: v.price,
              stock: v.stock,
              barcode: v.barcode || `SKU-${v.sku}`,
            });
          });
        } else {
          variantsList.push({
            productId: p.id,
            productName: p.name,
            sku: `SKU-${p.id}`,
            name: `${p.name} - Standard`,
            price: p.price,
            stock: p.stock || 0,
            barcode: p.barcode || `AFR-${p.id}`,
          });
        }
      });
      return NextResponse.json({ success: true, view, count: variantsList.length, variants: variantsList });
    }

    // Default View: Products
    return NextResponse.json({
      success: true,
      view,
      count: products.length,
      products: products.map(p => ({
        id: p.id || p._id.toString(),
        name: p.name,
        category: p.category,
        subCategory: p.subCategory || 'General',
        price: p.price,
        originalPrice: p.originalPrice || p.price,
        stock: p.stock || 0,
        image: p.image || p.images?.[0] || '/images/placeholder.png',
        vendorEmail: p.vendorEmail || 'vendor@africart.com',
        vendorStoreName: p.vendorStoreName || 'AfriCart Store',
        moderationStatus: p.moderationStatus || 'approved',
        isFeatured: !!p.isFeatured,
        brand: p.brand || 'AfriCart Genuine',
        unit: p.unit || 'pcs',
        barcode: p.barcode || `AFR-${(p.id || '893').substring(0, 8).toUpperCase()}`,
        qrCode: p.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://africart.app/product/${p.id}`,
        rating: p.rating || 4.5,
        reviewsCount: p.reviews?.length || 0,
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent',
      })),
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/products:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, category, price, description, vendorEmail, vendorStoreName, stock, brand, unit } = body;

    if (!name || !price || !category) {
      return NextResponse.json({ success: false, message: 'Product name, price, and category are required' }, { status: 400 });
    }

    const productId = `PROD-${Date.now().toString().slice(-6)}`;
    const barcode = `AFR-${Date.now().toString().slice(-8)}`;
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://africart.app/product/${productId}`;

    const newProduct = await Product.create({
      id: productId,
      name,
      category,
      subCategory: 'General',
      price: parseFloat(price),
      originalPrice: parseFloat(price),
      description: description || 'High quality authentic product on AfriCart marketplace.',
      image: '/images/placeholder.png',
      images: ['/images/placeholder.png'],
      vendorEmail: vendorEmail || 'vendor@africart.com',
      vendorStoreName: vendorStoreName || 'AfriCart Vendor',
      stock: parseInt(stock || '10', 10),
      moderationStatus: 'approved',
      isFeatured: false,
      brand: brand || 'AfriCart Genuine',
      unit: unit || 'pcs',
      barcode,
      qrCode,
      rating: 5.0,
      reviews: [],
    });

    return NextResponse.json({
      success: true,
      message: `Product "${name}" created successfully!`,
      product: {
        id: newProduct.id,
        name: newProduct.name,
        barcode: newProduct.barcode,
        qrCode: newProduct.qrCode,
      },
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create product' }, { status: 500 });
  }
}

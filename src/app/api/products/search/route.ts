import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const sort = searchParams.get('sort') || 'newest'; // newest, price_asc, price_desc, rating, best_selling
    const rating = parseFloat(searchParams.get('rating') || '0');
    const inStock = searchParams.get('inStock') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    // Text search (uses MongoDB text index)
    if (q) {
      // Use regex for partial matching (more flexible than $text)
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { subCategory: { $regex: q, $options: 'i' } },
        { vendorStoreName: { $regex: q, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Price range
    query.price = { $gte: minPrice, $lte: maxPrice };

    // Rating filter
    if (rating > 0) {
      query.rating = { $gte: rating };
    }

    // In-stock filter
    if (inStock) {
      query.stock = { $gt: 0 };
    }

    // Sort options
    let sortObj: any = {};
    switch (sort) {
      case 'price_asc': sortObj = { price: 1 }; break;
      case 'price_desc': sortObj = { price: -1 }; break;
      case 'rating': sortObj = { rating: -1 }; break;
      case 'name_asc': sortObj = { name: 1 }; break;
      case 'name_desc': sortObj = { name: -1 }; break;
      case 'newest':
      default: sortObj = { createdAt: -1 }; break;
    }

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    // Map to frontend format
    const mappedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      image: p.image,
      description: p.description,
      subCategory: p.subCategory,
      rating: p.rating,
      isNew: p.isNewProduct,
      isLimited: p.isLimited,
      isFlashSale: p.isFlashSale,
      flashSalePrice: p.flashSalePrice,
      flashSaleEnd: p.flashSaleEnd,
      sizes: p.sizes,
      colors: p.colors,
      vendorEmail: p.vendorEmail,
      vendorStoreName: p.vendorStoreName,
      stock: p.stock || 0,
    }));

    return NextResponse.json({
      success: true,
      products: mappedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Search Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

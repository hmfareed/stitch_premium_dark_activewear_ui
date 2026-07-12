import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Follower } from '@/models/Follower';
import { Notification } from '@/models/Notification';
import { products as defaultProducts } from '@/data/products';

export async function GET() {
  try {
    await connectToDatabase();
    
    let dbProducts = await Product.find({}).sort({ createdAt: -1 });
    
    if (dbProducts.length === 0 && defaultProducts && defaultProducts.length > 0) {
      const seeded = defaultProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        originalPrice: p.originalPrice,
        image: p.image,
        images: p.images || [],
        description: p.description || "",
        subCategory: p.subCategory || "",
        rating: p.rating || 5,
        reviews: p.reviews || [],
        isNewProduct: p.isNew,
        isLimited: p.isLimited,
        isFlashSale: p.isFlashSale,
        flashSalePrice: p.flashSalePrice,
        flashSaleEnd: p.flashSaleEnd,
        sizes: p.sizes || [],
        colors: p.colors || [],
        vendorEmail: p.vendorEmail || "vendor@africart.com",
        vendorStoreName: p.vendorStoreName || "AfriCart Elite",
        stock: p.stock || 10
      }));
      await Product.insertMany(seeded);
      dbProducts = await Product.find({}).sort({ createdAt: -1 });
    }

    const products = dbProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      image: p.image,
      images: p.images || [],
      description: p.description,
      subCategory: p.subCategory,
      rating: p.rating,
      reviews: p.reviews || [],
      isNew: p.isNewProduct,
      isLimited: p.isLimited,
      isFlashSale: p.isFlashSale,
      flashSalePrice: p.flashSalePrice,
      flashSaleEnd: p.flashSaleEnd,
      sizes: p.sizes || [],
      colors: p.colors || [],
      vendorEmail: p.vendorEmail,
      vendorStoreName: p.vendorStoreName,
      stock: p.stock || 0
    }));

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Fetch Products Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const productData = await req.json();
    const { isNew, ...restData } = productData;

    const newProduct = await Product.create({
      ...restData,
      isNewProduct: isNew,
      id: `PROD-${Date.now()}`
    });

    const returnedProduct = {
      ...newProduct.toObject(),
      isNew: newProduct.isNewProduct
    };

    // Notify all followers of this vendor
    if (newProduct.vendorEmail) {
      const followers = await Follower.find({ vendorEmail: newProduct.vendorEmail });
      if (followers.length > 0) {
        const notifications = followers.map(f => ({
          userEmail: f.userEmail,
          title: 'New Product Drop!',
          message: `${newProduct.vendorStoreName || 'A store you follow'} just added a new product: ${newProduct.name}. Be the first to check it out!`,
          type: 'product_drop',
          link: `/shop?category=all` // You could link directly to the product page if you have dynamic routes
        }));
        await Notification.insertMany(notifications);
      }
    }

    return NextResponse.json({ success: true, product: returnedProduct });
  } catch (error: any) {
    console.error('Create Product Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await connectToDatabase();
    await Product.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete All Products Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    let product = await Product.findOne({ id }).lean();
    if (!product) {
      product = await Product.findById(id).lean();
    }

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id || product._id.toString(),
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock || 0,
        image: product.image || product.images?.[0],
        images: product.images || [],
        description: product.description,
        vendorEmail: product.vendorEmail,
        vendorStoreName: product.vendorStoreName,
        moderationStatus: product.moderationStatus || 'approved',
        isFeatured: !!product.isFeatured,
        brand: product.brand || 'AfriCart Genuine',
        unit: product.unit || 'pcs',
        barcode: product.barcode || `AFR-${Date.now().toString().slice(-8)}`,
        qrCode: product.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://africart.app/product/${product.id}`,
        rating: product.rating,
        reviews: product.reviews || [],
        variants: product.variants || [],
        attributes: product.attributes || [],
      },
    });
  } catch (error: any) {
    console.error('Error fetching product detail:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch product details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    let product = await Product.findOne({ id });
    if (!product) {
      product = await Product.findById(id);
    }

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Action 1: Approve Product
    if (action === 'approve') {
      product.moderationStatus = 'approved';
      await product.save();
      return NextResponse.json({ success: true, message: `Product "${product.name}" approved!` });
    }

    // Action 2: Reject Product
    if (action === 'reject') {
      product.moderationStatus = 'flagged';
      await product.save();
      return NextResponse.json({ success: true, message: `Product "${product.name}" rejected / flagged.` });
    }

    // Action 3: Feature Product Toggle
    if (action === 'feature') {
      const nextFeatured = !product.isFeatured;
      product.isFeatured = nextFeatured;
      await product.save();
      return NextResponse.json({
        success: true,
        message: `Product "${product.name}" is ${nextFeatured ? 'now Featured' : 'no longer Featured'}.`,
        isFeatured: nextFeatured,
      });
    }

    // Action 4: Generate Barcode
    if (action === 'generate_barcode') {
      const newBarcode = `AFR-${Math.floor(10000000 + Math.random() * 90000000)}`;
      product.barcode = newBarcode;
      await product.save();
      return NextResponse.json({
        success: true,
        message: `Barcode ${newBarcode} generated for "${product.name}".`,
        barcode: newBarcode,
      });
    }

    // Action 5: Generate QR Code
    if (action === 'generate_qr') {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://africart.app/product/${product.id}`;
      product.qrCode = qrUrl;
      await product.save();
      return NextResponse.json({
        success: true,
        message: `QR code generated for "${product.name}".`,
        qrCode: qrUrl,
      });
    }

    // Action 6: Update Details
    if (action === 'update_details') {
      const { name, category, price, stock, brand, unit } = body;
      if (name) product.name = name;
      if (category) product.category = category;
      if (price !== undefined) product.price = parseFloat(price);
      if (stock !== undefined) product.stock = parseInt(stock, 10);
      if (brand) product.brand = brand;
      if (unit) product.unit = unit;
      await product.save();

      return NextResponse.json({ success: true, message: `Product "${product.name}" updated successfully!` });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const result = await Product.deleteOne({ $or: [{ id }, { _id: id }] });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete product' }, { status: 500 });
  }
}

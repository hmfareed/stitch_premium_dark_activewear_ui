import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, items } = body;

    // Bulk Export CSV
    if (action === 'export') {
      const products = await Product.find({}).sort({ createdAt: -1 }).lean();

      let csvHeader = 'ID,Name,Category,Price,Stock,VendorStore,Brand,Unit,Barcode,Status\n';
      let csvRows = products.map(p => {
        const name = (p.name || '').replace(/,/g, ' ');
        const vendor = (p.vendorStoreName || 'AfriCart Store').replace(/,/g, ' ');
        return `${p.id || p._id.toString()},${name},${p.category || 'General'},${p.price || 0},${p.stock || 0},${vendor},${p.brand || 'AfriCart'},${p.unit || 'pcs'},${p.barcode || 'N/A'},${p.moderationStatus || 'approved'}`;
      }).join('\n');

      const fullCsv = csvHeader + csvRows;

      return NextResponse.json({
        success: true,
        message: 'Product catalog exported successfully.',
        csvContent: fullCsv,
        filename: `africart_products_catalog_${Date.now()}.csv`,
      });
    }

    // Bulk Import
    if (action === 'import') {
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, message: 'No valid product items provided for bulk import' }, { status: 400 });
      }

      const importedProducts = [];
      for (const item of items) {
        const productId = `PROD-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;
        const barcode = item.barcode || `AFR-${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 10)}`;
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://africart.app/product/${productId}`;

        const created = await Product.create({
          id: productId,
          name: item.name || 'Imported Retail Item',
          category: item.category || 'General',
          subCategory: item.subCategory || 'General',
          price: parseFloat(item.price || 50),
          originalPrice: parseFloat(item.price || 50),
          description: item.description || 'Authentic product imported to catalog.',
          image: item.image || '/images/placeholder.png',
          images: [item.image || '/images/placeholder.png'],
          vendorEmail: item.vendorEmail || 'vendor@africart.com',
          vendorStoreName: item.vendorStoreName || 'AfriCart Store',
          stock: parseInt(item.stock || 20, 10),
          moderationStatus: 'approved',
          isFeatured: false,
          brand: item.brand || 'AfriCart Genuine',
          unit: item.unit || 'pcs',
          barcode,
          qrCode,
        });
        importedProducts.push(created.id);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${importedProducts.length} product(s) into catalog!`,
        count: importedProducts.length,
      });
    }

    return NextResponse.json({ success: false, message: 'Unsupported bulk action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/admin/products/bulk:', error);
    return NextResponse.json({ success: false, message: error.message || 'Bulk operation failed' }, { status: 500 });
  }
}

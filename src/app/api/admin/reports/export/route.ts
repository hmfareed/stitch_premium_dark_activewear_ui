import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { format = 'csv', reportType = 'sales', timeframe = 'monthly' } = body;

    const [orders, products, users] = await Promise.all([
      Order.find({}).lean(),
      Product.find({}).lean(),
      User.find({}).lean(),
    ]);

    // CSV & Excel export generator
    if (format === 'csv' || format === 'excel') {
      let csvHeader = 'ReportType,Identifier,Name_Customer,Category_Role,Amount_Value(GHS),Status_Condition,Date\n';
      let csvRows = '';

      if (reportType === 'products' || reportType === 'inventory') {
        csvRows = products.map(p => `${reportType.toUpperCase()},${p.id || p._id.toString()},"${(p.name || '').replace(/"/g, '""')}",${p.category || 'General'},${p.price || 0},${p.stock || 0} units,${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}`).join('\n');
      } else if (reportType === 'customers') {
        csvRows = users.map(u => `${reportType.toUpperCase()},${u._id.toString()},"${(u.name || '').replace(/"/g, '""')}",${u.role || 'customer'},${u.points || 0},${u.isActive ? 'ACTIVE' : 'SUSPENDED'},${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}`).join('\n');
      } else {
        // Sales / Orders / Revenue / Taxes / Commissions / Expenses / Profit / Subscriptions
        csvRows = orders.map(o => `${reportType.toUpperCase()},${o.orderId},"${(o.customerName || '').replace(/"/g, '""')}",${o.customerEmail},${o.total || 0},${(o.status || 'Pending').toUpperCase()},${o.date ? new Date(o.date).toLocaleDateString() : 'N/A'}`).join('\n');
      }

      const fullContent = csvHeader + csvRows;
      const fileExt = format === 'excel' ? 'xls' : 'csv';
      const filename = `africart_${reportType}_report_${timeframe}_${Date.now()}.${fileExt}`;

      return NextResponse.json({
        success: true,
        message: `Executive ${reportType.toUpperCase()} report exported successfully to ${format.toUpperCase()}!`,
        content: fullContent,
        filename,
      });
    }

    // PDF Printable Report metadata payload
    if (format === 'pdf') {
      const totalSales = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + (o.total || 0), 0);
      const totalOrders = orders.length;

      return NextResponse.json({
        success: true,
        message: `PDF printable document generated for ${reportType.toUpperCase()}!`,
        pdfPayload: {
          title: `Africart Executive Analytics Report — ${reportType.toUpperCase()}`,
          timeframe,
          generatedDate: new Date().toLocaleString(),
          totalSales,
          totalOrders,
          author: 'Super Admin Governance Engine',
        },
      });
    }

    return NextResponse.json({ success: false, message: 'Unsupported export format' }, { status: 400 });
  } catch (error: any) {
    console.error('Error exporting report:', error);
    return NextResponse.json({ success: false, message: 'Failed to export report' }, { status: 500 });
  }
}

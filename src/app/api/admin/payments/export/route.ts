import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PaymentTransaction } from '@/models/PaymentTransaction';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const transactions = await PaymentTransaction.find({}).sort({ createdAt: -1 }).lean();

    let csvHeader = 'TransactionID,OrderID,CustomerName,CustomerEmail,Amount(GHS),Channel,Status,GatewayReference,Date\n';
    let csvRows = transactions.map(t => {
      const name = (t.customerName || '').replace(/,/g, ' ');
      const ref = (t.channelDetails?.reference || 'N/A').replace(/,/g, ' ');
      const date = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A';
      return `${t.transactionId},${t.orderId},${name},${t.customerEmail},${t.amount || 0},${t.channel.toUpperCase()},${t.status.toUpperCase()},${ref},${date}`;
    }).join('\n');

    const fullCsv = csvHeader + csvRows;

    return NextResponse.json({
      success: true,
      message: 'Payment transactions exported successfully.',
      csvContent: fullCsv,
      filename: `africart_payments_export_${Date.now()}.csv`,
    });
  } catch (error: any) {
    console.error('Error exporting transactions:', error);
    return NextResponse.json({ success: false, message: 'Failed to export transactions' }, { status: 500 });
  }
}

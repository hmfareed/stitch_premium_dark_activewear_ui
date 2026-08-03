import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Payout } from '@/models/Payout';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const payouts = await Payout.find({}).sort({ requestDate: -1 }).lean();

    let csvHeader = 'PayoutRef,VendorEmail,VendorName,Amount(GHS),Status,PaymentMethod,AccountDetails,RequestDate,ProcessedDate\n';
    let csvRows = payouts.map(p => {
      const ref = p.payoutRef || `PAYOUT-${p._id.toString().slice(-6).toUpperCase()}`;
      const name = (p.vendorName || 'Vendor').replace(/,/g, ' ');
      const method = (p.paymentMethod || 'Mobile Money').replace(/,/g, ' ');
      const acc = (p.accountDetails || 'N/A').replace(/,/g, ' ');
      const reqDate = p.requestDate ? new Date(p.requestDate).toLocaleDateString() : 'N/A';
      const procDate = p.processedDate ? new Date(p.processedDate).toLocaleDateString() : 'Pending';

      return `${ref},${p.vendorEmail},${name},${p.amount || 0},${p.status.toUpperCase()},${method},${acc},${reqDate},${procDate}`;
    }).join('\n');

    const fullCsv = csvHeader + csvRows;

    return NextResponse.json({
      success: true,
      message: 'Payout records exported successfully.',
      csvContent: fullCsv,
      filename: `africart_payouts_export_${Date.now()}.csv`,
    });
  } catch (error: any) {
    console.error('Error exporting payouts:', error);
    return NextResponse.json({ success: false, message: 'Failed to export payouts' }, { status: 500 });
  }
}

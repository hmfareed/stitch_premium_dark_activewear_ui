import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CommissionRule, CommissionType } from '@/models/CommissionRule';
import { CommissionLog } from '@/models/CommissionLog';
import { Payout } from '@/models/Payout';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const [rules, logs, payouts] = await Promise.all([
      CommissionRule.find({}).sort({ createdAt: -1 }).lean(),
      CommissionLog.find({}).sort({ createdAt: -1 }).limit(50).lean(),
      Payout.find({}).sort({ requestDate: -1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      rules: rules.map(r => ({
        id: r._id.toString(),
        ruleId: r.ruleId,
        type: r.type,
        name: r.name,
        rate: r.rate,
        targetVendorEmail: r.targetVendorEmail || 'All Vendors',
        targetCategory: r.targetCategory || 'All Categories',
        isActive: r.isActive !== false,
      })),
      history: logs.map(l => ({
        id: l._id.toString(),
        logId: l.logId,
        orderId: l.orderId,
        vendorEmail: l.vendorEmail,
        vendorName: l.vendorName,
        grossAmount: l.grossAmount,
        commissionType: l.commissionType,
        commissionAmount: l.commissionAmount,
        netVendorAmount: l.netVendorAmount,
        isManualAdjustment: !!l.isManualAdjustment,
        notes: l.notes || 'Automated order commission',
        createdAt: l.createdAt ? new Date(l.createdAt).toLocaleString() : 'Recent',
      })),
      payouts: payouts.map(p => ({
        id: p._id.toString(),
        vendorEmail: p.vendorEmail,
        vendorName: p.vendorName || 'Vendor',
        amount: p.amount,
        status: p.status,
        requestDate: p.requestDate ? new Date(p.requestDate).toLocaleDateString() : 'Recent',
        paymentMethod: p.paymentMethod || 'Mobile Money',
        accountDetails: p.accountDetails || 'N/A',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching commission engine data:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch commissions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action } = body;

    // Action 1: Create Commission Rule
    if (action === 'create_rule') {
      const { type, name, rate, targetVendorEmail, targetCategory } = body;
      if (!type || !name || rate === undefined) {
        return NextResponse.json({ success: false, message: 'Rule type, name, and rate are required' }, { status: 400 });
      }

      const ruleId = `RULE-${Date.now().toString().slice(-6)}`;
      const newRule = await CommissionRule.create({
        ruleId,
        type: type as CommissionType,
        name,
        rate: parseFloat(rate),
        targetVendorEmail: targetVendorEmail || undefined,
        targetCategory: targetCategory || undefined,
        isActive: true,
      });

      return NextResponse.json({
        success: true,
        message: `Commission rule "${name}" created successfully!`,
        rule: newRule,
      });
    }

    // Action 2: Auto Calculate Commission for Order
    if (action === 'auto_calculate') {
      const { grossAmount, vendorEmail, category, orderId } = body;
      const amount = parseFloat(grossAmount || 0);

      // Precedence: Vendor Specific > Category Specific > Percentage / Fixed global
      let applicableRule = await CommissionRule.findOne({ type: 'vendor_specific', targetVendorEmail: vendorEmail, isActive: true });
      if (!applicableRule && category) {
        applicableRule = await CommissionRule.findOne({ type: 'category_specific', targetCategory: category, isActive: true });
      }
      if (!applicableRule) {
        applicableRule = await CommissionRule.findOne({ type: 'percentage', isActive: true });
      }
      if (!applicableRule) {
        applicableRule = await CommissionRule.findOne({ type: 'fixed', isActive: true });
      }

      let commAmount = 0;
      let commType = 'Global Percentage (5%)';

      if (applicableRule) {
        commType = applicableRule.name;
        if (applicableRule.type === 'fixed') {
          commAmount = applicableRule.rate;
        } else {
          commAmount = (amount * applicableRule.rate) / 100;
        }
      } else {
        commAmount = (amount * 5) / 100; // 5% default fallback
      }

      const netVendor = Math.max(0, amount - commAmount);
      const logId = `COMM-${Date.now().toString().slice(-8)}`;

      const log = await CommissionLog.create({
        logId,
        orderId: orderId || `ORD-${Date.now().toString().slice(-6)}`,
        vendorEmail: vendorEmail || 'ashanti@africart.com',
        vendorName: 'Ashanti Heritage Store',
        grossAmount: amount,
        commissionType: commType,
        commissionAmount: commAmount,
        netVendorAmount: netVendor,
        isManualAdjustment: false,
        notes: `Auto-calculated via ${commType}`,
      });

      return NextResponse.json({
        success: true,
        message: `Calculated platform commission: GH₵ ${commAmount.toFixed(2)} (${commType})`,
        calculation: {
          grossAmount: amount,
          commissionAmount: commAmount,
          netVendorAmount: netVendor,
          ruleName: commType,
          logId: log.logId,
        },
      });
    }

    // Action 3: Manual Adjustment
    if (action === 'manual_adjustment') {
      const { vendorEmail, adjustmentAmount, reason, orderId } = body;
      if (!vendorEmail || adjustmentAmount === undefined) {
        return NextResponse.json({ success: false, message: 'Vendor email and adjustment amount are required' }, { status: 400 });
      }

      const adjVal = parseFloat(adjustmentAmount);
      const logId = `MAN-${Date.now().toString().slice(-8)}`;

      const log = await CommissionLog.create({
        logId,
        orderId: orderId || `MAN-ADJ-${Date.now().toString().slice(-5)}`,
        vendorEmail,
        vendorName: 'Vendor Store',
        grossAmount: 0,
        commissionType: 'Manual Adjustment',
        commissionAmount: adjVal,
        netVendorAmount: -adjVal,
        isManualAdjustment: true,
        notes: reason || 'Manual commission adjustment by admin',
      });

      return NextResponse.json({
        success: true,
        message: `Manual adjustment of GH₵ ${adjVal.toFixed(2)} logged for ${vendorEmail}!`,
        log,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/admin/commissions:', error);
    return NextResponse.json({ success: false, message: error.message || 'Commission operation failed' }, { status: 500 });
  }
}

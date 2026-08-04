import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { Order } from '@/models/Order';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail }).lean() as any;

    const expenses = store?.accountingExpenses || [
      { id: 'exp-1', title: 'Monthly Store Rent - Accra Central', category: 'Store Rent & Utilities', amount: 1500.00, supplier: 'Accra Commercial Properties', receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=300', date: 'Aug 1, 2026', status: 'Paid' },
      { id: 'exp-2', title: 'Packaging Poly Mailer Bags (500pcs)', category: 'Packaging & Supplies', amount: 450.00, supplier: 'Ghana Packaging Ltd', receiptUrl: '', date: 'Jul 28, 2026', status: 'Paid' },
      { id: 'exp-3', title: 'Staff Bi-Weekly Payroll Allowance', category: 'Staff Payroll', amount: 3200.00, supplier: 'AfriCart Store Staff', receiptUrl: '', date: 'Jul 25, 2026', status: 'Paid' },
    ];

    const income = store?.accountingIncome || [
      { id: 'inc-101', title: 'Online Customer Orders Revenue', source: 'Online Marketplace', amount: 14500.00, method: 'Mobile Money / Card', date: 'Aug 4, 2026' },
      { id: 'inc-102', title: 'In-Store POS Terminal Sales', source: 'POS In-Store', amount: 6800.00, method: 'Cash / Split Tender', date: 'Aug 4, 2026' },
    ];

    const cashbook = store?.accountingCashbook || [
      { id: 'cb-1', date: 'Aug 4, 2026', openingBalance: 500.00, cashIn: 1850.00, cashOut: 350.00, closingBalance: 2000.00, note: 'Daily Register Cash Balanced' },
      { id: 'cb-2', date: 'Aug 3, 2026', openingBalance: 400.00, cashIn: 1400.00, cashOut: 1300.00, closingBalance: 500.00, note: 'Rent Deposit Withdrawal' },
    ];

    const categories = [
      { name: 'Store Rent & Utilities', type: 'Expense', count: 1 },
      { name: 'Packaging & Supplies', type: 'Expense', count: 1 },
      { name: 'Staff Payroll', type: 'Expense', count: 1 },
      { name: 'Courier Logistics', type: 'Expense', count: 0 },
      { name: 'Online Marketplace', type: 'Income', count: 1 },
      { name: 'POS In-Store', type: 'Income', count: 1 },
    ];

    const totalIncome = income.reduce((s: number, i: any) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    return NextResponse.json({
      success: true,
      expenses,
      income,
      cashbook,
      categories,
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
      },
    });
  } catch (error: any) {
    console.error('GET /api/vendor/accounting error:', error);
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
    const body = await req.json();
    const { action, expense } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (action === 'record_expense') {
      const existingExpenses = (store.get('accountingExpenses') as any[]) || [
        { id: 'exp-1', title: 'Monthly Store Rent - Accra Central', category: 'Store Rent & Utilities', amount: 1500.00, supplier: 'Accra Commercial Properties', receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=300', date: 'Aug 1, 2026', status: 'Paid' },
      ];

      const newExpense = {
        id: `exp-${Date.now().toString(36)}`,
        title: expense.title,
        category: expense.category || 'Store Rent & Utilities',
        amount: Number(expense.amount) || 0,
        supplier: expense.supplier || 'Vendor Supplier',
        receiptUrl: expense.receiptUrl || '',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Paid',
      };

      existingExpenses.unshift(newExpense);
      store.set('accountingExpenses', existingExpenses);
      await store.save();

      return NextResponse.json({
        success: true,
        expenses: existingExpenses,
        message: `Expense "${expense.title}" recorded!`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/accounting error:', error);
    return NextResponse.json({ error: error.message || 'Accounting action failed' }, { status: 500 });
  }
}

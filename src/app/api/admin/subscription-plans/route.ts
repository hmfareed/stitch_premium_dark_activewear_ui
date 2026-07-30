import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { SubscriptionPlan, ensureDefaultPlans } from '@/models/SubscriptionPlan';

// GET all subscription plans
export async function GET() {
  try {
    await connectToDatabase();
    await ensureDefaultPlans();
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    return NextResponse.json({ success: true, plans });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create or update a subscription plan (superadmin only)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { tier, name, price, maxProducts, maxStaff, maxImagesPerProduct, maxDiscounts, features, gracePeriodDays, commissionRate } = body;

    if (!tier || !name) {
      return NextResponse.json({ success: false, error: 'Tier and name are required' }, { status: 400 });
    }

    let plan = await SubscriptionPlan.findOne({ tier });
    if (plan) {
      // Update existing plan
      if (name !== undefined) plan.name = name;
      if (price !== undefined) plan.price = price;
      if (maxProducts !== undefined) plan.maxProducts = maxProducts;
      if (maxStaff !== undefined) plan.maxStaff = maxStaff;
      if (maxImagesPerProduct !== undefined) plan.maxImagesPerProduct = maxImagesPerProduct;
      if (maxDiscounts !== undefined) plan.maxDiscounts = maxDiscounts;
      if (features !== undefined) plan.features = { ...plan.features, ...features };
      if (gracePeriodDays !== undefined) plan.gracePeriodDays = gracePeriodDays;
      if (commissionRate !== undefined) plan.commissionRate = commissionRate;
      await plan.save();
      return NextResponse.json({ success: true, message: `Plan "${tier}" updated.`, plan });
    }

    // Create new plan
    plan = await SubscriptionPlan.create({
      tier, name, price: price || 0, maxProducts, maxStaff, maxImagesPerProduct, maxDiscounts,
      features: features || {},
      gracePeriodDays: gracePeriodDays || 7,
      commissionRate: commissionRate || 0,
    });

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

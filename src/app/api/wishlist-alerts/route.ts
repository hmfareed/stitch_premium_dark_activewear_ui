import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { sendSMS } from '@/lib/sms';

/**
 * POST /api/wishlist-alerts
 * Called when a product price drops to notify subscribed users.
 * Body: { productId, productName, oldPrice, newPrice }
 *
 * GET /api/wishlist-alerts?email=xxx&productId=xxx
 * Check if a user has an alert set for a product.
 */

// Using User's wishlist from AppContext (client-side localStorage).
// This API notifies users when product price drops by checking email lists.

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { productId, productName, newPrice, oldPrice, subscriberEmails } = await req.json();

    if (!productId || !subscriberEmails?.length) {
      return NextResponse.json({ success: false, error: 'productId and subscriberEmails are required' }, { status: 400 });
    }

    const savingsAmount = (oldPrice - newPrice).toFixed(2);
    const message = `🔥 Price Drop Alert! ${productName} is now GH₵${newPrice.toFixed(2)} (was GH₵${oldPrice.toFixed(2)}). Save GH₵${savingsAmount}! Shop now: africart-one.vercel.app`;

    // Fetch phone numbers for subscribers
    const users = await User.find({ email: { $in: subscriberEmails } }).select('email phone name').lean();

    const results = await Promise.allSettled(
      users.map(async (u: any) => {
        if (!u.phone) return { email: u.email, status: 'no_phone' };
        const result = await sendSMS(u.phone, message);
        return { email: u.email, status: result.success ? 'sent' : 'failed', simulated: result.simulated };
      })
    );

    return NextResponse.json({ success: true, notified: results.length, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

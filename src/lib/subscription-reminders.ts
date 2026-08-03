/**
 * Subscription lifecycle management (Phase 9.6).
 *
 * Handles:
 * - Reminder SMS + in-app notifications at configured intervals before expiry
 * - Grace period: store stays live with a "renew now" banner
 * - Lapse: after grace period, store flips back to non-public draft state
 *
 * This is designed to be called by a scheduled cron job (e.g. daily at midnight).
 * It is idempotent — running it multiple times on the same day is safe because
 * remindersSent tracks which intervals have already been dispatched.
 *
 * Reminder cadence (Phase 9.6):
 *   Trial: 7 days, 3 days, 1 day before expiry
 *   Paid:  30 days, 14 days, 3 days before expiry
 */

import connectToDatabase from './mongodb';
import { VendorSubscription } from '@/models/VendorSubscription';
import { Store } from '@/models/Store';
import { Notification } from '@/models/Notification';
import { sendSMS } from './sms';

// How many ms before endDate each reminder fires
const TRIAL_REMINDERS_MS: Array<{ key: string; ms: number }> = [
  { key: '7d', ms: 7  * 24 * 60 * 60 * 1000 },
  { key: '3d', ms: 3  * 24 * 60 * 60 * 1000 },
  { key: '1d', ms: 1  * 24 * 60 * 60 * 1000 },
];

const PAID_REMINDERS_MS: Array<{ key: string; ms: number }> = [
  { key: '30d', ms: 30 * 24 * 60 * 60 * 1000 },
  { key: '14d', ms: 14 * 24 * 60 * 60 * 1000 },
  { key: '3d',  ms: 3  * 24 * 60 * 60 * 1000 },
];

export interface LifecycleRunResult {
  remindersDispatched: number;
  gracePeriodActivated: number;
  lapsedToDraft: number;
  errors: string[];
}

/**
 * Main lifecycle runner — call daily from a cron job or an API endpoint.
 */
export async function runSubscriptionLifecycle(): Promise<LifecycleRunResult> {
  await connectToDatabase();

  const now = new Date();
  const result: LifecycleRunResult = {
    remindersDispatched: 0,
    gracePeriodActivated: 0,
    lapsedToDraft: 0,
    errors: [],
  };

  // Find all active subscriptions (not yet lapsed)
  const activeSubs = await VendorSubscription.find({
    status: { $in: ['active', 'grace'] },
  });

  for (const sub of activeSubs) {
    try {
      const timeUntilExpiry = sub.endDate.getTime() - now.getTime();

      // ── 1. Dispatch pre-expiry reminders ──────────────────────────────────
      const reminders = sub.planTier === 'trial' ? TRIAL_REMINDERS_MS : PAID_REMINDERS_MS;

      for (const { key, ms } of reminders) {
        if (sub.remindersSent.includes(key)) continue; // already sent

        // Fire if we're within the reminder window
        if (timeUntilExpiry > 0 && timeUntilExpiry <= ms) {
          const daysLeft = Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000));
          await dispatchReminder(sub.vendorEmail, sub.planTier, sub.planName, daysLeft, sub.endDate);

          sub.remindersSent.push(key);
          result.remindersDispatched++;
        }
      }

      // ── 2. Transition expired active → grace ──────────────────────────────
      if (sub.status === 'active' && now > sub.endDate) {
        sub.status = 'grace';
        result.gracePeriodActivated++;

        // Notify vendor
        await dispatchGraceNotification(sub.vendorEmail, sub.planTier, sub.planName, sub.gracePeriodEndDate);
      }

      // ── 3. Transition grace → lapsed ─────────────────────────────────────
      if (sub.status === 'grace' && sub.gracePeriodEndDate && now > sub.gracePeriodEndDate) {
        sub.status = 'lapsed';

        // Flip associated store(s) back to non-public draft state
        await Store.updateMany(
          { vendorEmail: sub.vendorEmail, status: 'active' },
          { status: 'setup' } // draft — verified status is untouched
        );

        result.lapsedToDraft++;

        // Notify vendor
        await Notification.create({
          userEmail: sub.vendorEmail,
          title: 'Store Paused — Subscription Lapsed',
          message: `Your AfriCart ${sub.planName} subscription has lapsed. Your store is now in draft mode. Renew your subscription to go live again.`,
          type: 'subscription',
          link: '/vendor/billing',
        });
      }

      await sub.save();
    } catch (err: any) {
      result.errors.push(`[${sub.vendorEmail}] ${err.message}`);
    }
  }

  return result;
}

// ── Helper: dispatch reminder via SMS + in-app notification ─────────────────

async function dispatchReminder(
  vendorEmail: string,
  planTier: string,
  planName: string,
  daysLeft: number,
  endDate: Date
) {
  const isTrial = planTier === 'trial';
  const title = isTrial
    ? `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
    : `Your ${planName} plan renews in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;

  const message = isTrial
    ? `Your AfriCart free trial expires on ${endDate.toLocaleDateString('en-GB')}. Subscribe to Basic, Plus, or Pro to keep your store live.`
    : `Your AfriCart ${planName} subscription expires on ${endDate.toLocaleDateString('en-GB')}. Renew now to avoid any interruption.`;

  // In-app notification
  await Notification.create({
    userEmail: vendorEmail,
    title,
    message,
    type: 'subscription',
    link: '/vendor/billing',
  });

  // SMS — stubbed until Hubtel/mNotify keys are configured
  try {
    await sendSMS(vendorEmail, `AfriCart: ${message} Visit africart.com/vendor/billing`);
  } catch {
    console.log(`[subscription-reminders] SMS stub for ${vendorEmail}: ${message}`);
  }
}

async function dispatchGraceNotification(
  vendorEmail: string,
  _planTier: string,
  planName: string,
  gracePeriodEnd?: Date
) {
  const graceDateStr = gracePeriodEnd
    ? gracePeriodEnd.toLocaleDateString('en-GB')
    : 'soon';

  await Notification.create({
    userEmail: vendorEmail,
    title: `${planName} subscription expired — grace period active`,
    message: `Your subscription has expired but your store is still live until ${graceDateStr}. Renew now to avoid interruption.`,
    type: 'subscription',
    link: '/vendor/billing',
  });
}

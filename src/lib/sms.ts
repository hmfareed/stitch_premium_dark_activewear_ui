/**
 * SMS helper module for AfriCart notifications.
 * Supports Arkesel (primary), mNotify, or Hubtel SMS gateways.
 * If credentials are not configured in `.env.local`, it runs in simulation mode.
 */

export interface SMSSendResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: any;
}

export const sendSMS = async (to: string, message: string): Promise<SMSSendResult> => {
  try {
    // Normalize to international format: 233XXXXXXXXX
    const cleaned = to.replace(/[\s\-]/g, '');
    let formattedPhone = cleaned;
    if (cleaned.startsWith('0')) {
      formattedPhone = '233' + cleaned.substring(1);
    } else if (cleaned.startsWith('+233')) {
      formattedPhone = cleaned.substring(1);
    } else if (!cleaned.startsWith('233') && cleaned.length === 9) {
      formattedPhone = '233' + cleaned;
    }

    const arkeselApiKey    = process.env.ARKESEL_API_KEY;
    const mnotifyApiKey    = process.env.MNOTIFY_API_KEY;
    const hubtelClientId   = process.env.HUBTEL_CLIENT_ID;
    const hubtelSecret     = process.env.HUBTEL_CLIENT_SECRET;

    const hasAnyGateway = arkeselApiKey || mnotifyApiKey || (hubtelClientId && hubtelSecret);

    if (!hasAnyGateway) {
      console.log('--- SMS SIMULATION (no gateway configured) ---');
      console.log(`To: ${formattedPhone}`);
      console.log(`Message: ${message}`);
      console.log('----------------------------------------------');
      return { success: true, simulated: true, messageId: `sim_${Math.random().toString(36).substring(2, 11)}` };
    }

    // ── 1. Arkesel (primary) ──────────────────────────────────────────────────
    if (arkeselApiKey) {
      const res = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': arkeselApiKey,
        },
        body: JSON.stringify({
          sender: 'AfriCart',
          message,
          recipients: [formattedPhone],
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        console.log(`Arkesel SMS sent. ID: ${data.data?.[0]?.id ?? 'n/a'}`);
        return { success: true, messageId: data.data?.[0]?.id ?? 'arkesel' };
      } else {
        console.error('Arkesel SMS error:', data);
        throw new Error(data.message || 'Arkesel failed');
      }
    }

    // ── 2. mNotify (fallback) ─────────────────────────────────────────────────
    if (mnotifyApiKey) {
      const res = await fetch(`https://api.mnotify.com/v2/sms/send?key=${mnotifyApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: [formattedPhone],
          sender: 'AfriCart',
          message,
          is_schedule: false,
        }),
      });
      const data = await res.json();
      if (res.ok && (data.status === 'success' || data.code === '1000')) {
        console.log(`mNotify SMS sent. ID: ${data.summary?.message_id ?? data.id}`);
        return { success: true, messageId: String(data.summary?.message_id ?? data.id) };
      } else {
        console.error('mNotify SMS error:', data);
        throw new Error(data.message || 'mNotify failed');
      }
    }

    // ── 3. Hubtel (fallback) ──────────────────────────────────────────────────
    if (hubtelClientId && hubtelSecret) {
      const auth = Buffer.from(`${hubtelClientId}:${hubtelSecret}`).toString('base64');
      const res = await fetch('https://api.hubtel.com/v1/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
        body: JSON.stringify({ from: 'AfriCart', to: formattedPhone, content: message, registeredDelivery: true }),
      });
      const data = await res.json();
      if (res.ok && (data.status === '0' || data.status === 'Success')) {
        console.log(`Hubtel SMS sent. ID: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      } else {
        console.error('Hubtel SMS error:', data);
        throw new Error(data.message || 'Hubtel failed');
      }
    }

    return { success: false, error: 'No SMS gateway configured' };
  } catch (error: any) {
    console.error('SMS notification failed:', error);
    return { success: false, error: error.message || error };
  }
};

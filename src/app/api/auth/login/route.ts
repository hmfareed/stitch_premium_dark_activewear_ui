import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { LoginEvent } from '@/models/LoginEvent';

// Simple in-memory rate limiter
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = loginAttempts.get(email);
  
  if (!record) return { allowed: true };
  
  // Reset if lockout period has passed
  if (now - record.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(email);
    return { allowed: true };
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((LOCKOUT_DURATION - (now - record.lastAttempt)) / 1000);
    return { allowed: false, retryAfter };
  }
  
  return { allowed: true };
}

function recordFailedAttempt(email: string) {
  const now = Date.now();
  const record = loginAttempts.get(email);
  if (record) {
    record.count += 1;
    record.lastAttempt = now;
  } else {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
  }
}

function clearAttempts(email: string) {
  loginAttempts.delete(email);
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Check rate limit
    const rateCheck = checkRateLimit(normalizedEmail);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${Math.ceil((rateCheck.retryAfter || 0) / 60)} minutes.` },
        { status: 429 }
      );
    }

    // Extract device info from User-Agent header
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';

    let user = await User.findOne({ email: normalizedEmail });
    
    // Auto-provision Super Admin if it doesn't exist
    if (!user && normalizedEmail === 'africartsadmin99@gmail.com') {
      const hashedAdminPassword = await bcrypt.hash('admin', 12);
      user = await User.create({
        name: 'Super Admin',
        email: 'africartsadmin99@gmail.com',
        phone: '',
        role: 'super_admin',
        password: hashedAdminPassword,
      });
    }

    if (!user) {
      recordFailedAttempt(normalizedEmail);
      // Record failed login attempt
      try {
        await LoginEvent.create({
          email: normalizedEmail,
          userName: 'Unknown',
          success: false,
          ip,
          userAgent,
          device: parseDevice(userAgent),
          browser: parseBrowser(userAgent),
          os: parseOS(userAgent),
          failReason: 'User not found',
        });
      } catch {}
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Compare password using bcrypt
    // Support both hashed and legacy plaintext passwords for backwards compatibility
    let passwordValid = false;

    if (user.password) {
      // Check if the stored password is a bcrypt hash (starts with $2a$ or $2b$)
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        passwordValid = await bcrypt.compare(password, user.password);
      } else {
        // Legacy plaintext comparison — migrate to hashed on success
        passwordValid = user.password === password;
        if (passwordValid) {
          // Auto-migrate: hash the plaintext password
          const hashedPassword = await bcrypt.hash(password, 12);
          await User.updateOne({ email: normalizedEmail }, { $set: { password: hashedPassword } });
          console.log(`[Auth] Migrated password to bcrypt for: ${normalizedEmail}`);
        }
      }
    }

    // Fallback for super admin default password
    if (!passwordValid && normalizedEmail === 'africartsadmin99@gmail.com' && password === 'admin') {
      passwordValid = true;
      // Migrate the super admin password too
      const hashedPassword = await bcrypt.hash('admin', 12);
      await User.updateOne({ email: normalizedEmail }, { $set: { password: hashedPassword } });
    }

    if (!passwordValid) {
      recordFailedAttempt(normalizedEmail);
      // Record failed login attempt
      try {
        await LoginEvent.create({
          email: normalizedEmail,
          userName: user.name,
          success: false,
          ip,
          userAgent,
          device: parseDevice(userAgent),
          browser: parseBrowser(userAgent),
          os: parseOS(userAgent),
          failReason: 'Invalid password',
        });
      } catch {}
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Successful login — clear rate limit
    clearAttempts(normalizedEmail);

    // Record successful login
    try {
      await LoginEvent.create({
        email: user.email,
        userName: user.name,
        role: user.role,
        success: true,
        ip,
        userAgent,
        device: parseDevice(userAgent),
        browser: parseBrowser(userAgent),
        os: parseOS(userAgent),
      });
    } catch (err) {
      console.error('Failed to record login event:', err);
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profilePic
      }
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── Helper parsers ──
function parseDevice(ua: string): string {
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android.*Mobile/i.test(ua)) return 'Android Phone';
  if (/Android/i.test(ua)) return 'Android Tablet';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux PC';
  if (/curl/i.test(ua)) return 'CLI / Bot';
  return 'Unknown Device';
}

function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
  if (/Chrome/i.test(ua)) return 'Google Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/curl/i.test(ua)) return 'curl';
  return 'Unknown Browser';
}

function parseOS(ua: string): string {
  if (/Windows NT 10/i.test(ua)) return 'Windows 10/11';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/iPhone OS (\d+)/i.test(ua)) return `iOS ${ua.match(/iPhone OS (\d+)/)?.[1]}`;
  if (/Android (\d+)/i.test(ua)) return `Android ${ua.match(/Android (\d+)/)?.[1]}`;
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
}

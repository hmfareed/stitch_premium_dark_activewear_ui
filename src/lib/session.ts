import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/mongodb';
import { Session, ISession } from '@/models/Session';
import { User, IUser } from '@/models/User';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'africart_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Creates a server-side database-backed session document and sets the httpOnly cookie
 */
export async function createDatabaseSession(userId: string, activeRole: string = 'customer', reqHeaders?: Headers) {
  await connectToDatabase();

  const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  let ip = '127.0.0.1';
  let userAgent = 'Unknown';

  if (reqHeaders) {
    const forwarded = reqHeaders.get('x-forwarded-for');
    ip = forwarded ? forwarded.split(',')[0].trim() : reqHeaders.get('x-real-ip') || '127.0.0.1';
    userAgent = reqHeaders.get('user-agent') || 'Unknown';
  }

  const session = await Session.create({
    sessionId,
    userId,
    token,
    ip,
    userAgent,
    activeRole,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return { session, token };
}

/**
 * Validates current session from httpOnly cookie or Bearer token header
 */
export async function getSessionFromRequest(reqHeaders?: Headers): Promise<{ user: IUser; session: ISession } | null> {
  await connectToDatabase();

  let token: string | undefined;

  // Try reading from httpOnly cookie first
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  } catch (err) {
    // Context without cookies() helper
  }

  // Fallback to Authorization header if provided
  if (!token && reqHeaders) {
    const authHeader = reqHeaders.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const session = await Session.findOne({
    token,
    expiresAt: { $gt: new Date() },
  });

  if (!session) return null;

  const user = await User.findById(session.userId);
  if (!user || !user.isActive) return null;

  return { user, session };
}

/**
 * Revokes all active database sessions for a given user (e.g. on password reset or change)
 * Optional parameter to preserve current session
 */
export async function revokeAllUserSessions(userId: string, keepToken?: string) {
  await connectToDatabase();
  const query: Record<string, any> = { userId };
  if (keepToken) {
    query.token = { $ne: keepToken };
  }
  await Session.deleteMany(query);
}

/**
 * Revokes the current session and clears the httpOnly cookie
 */
export async function destroyCurrentSession() {
  await connectToDatabase();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await Session.deleteMany({ token });
      cookieStore.delete(SESSION_COOKIE_NAME);
    }
  } catch (err) {
    console.error('Error destroying session:', err);
  }
}

export async function getSession(reqHeaders?: Headers) {
  const result = await getSessionFromRequest(reqHeaders);
  if (!result) return null;
  return {
    userId: result.user._id.toString(),
    sessionId: result.session.sessionId,
    user: result.user,
    session: result.session,
  };
}

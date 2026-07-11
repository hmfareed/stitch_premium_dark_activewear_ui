import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not defined. Using a fallback secret key for development.');
}
const ACTUAL_SECRET = SECRET || 'africart-premium-secret-fallback-key-998877';

export interface AfriCartTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: 'customer' | 'vendor' | 'super_admin';
}

const DEFAULT_OPTIONS: SignOptions = {
  expiresIn: '7d',
};

/**
 * Sign a JWT for an AfriCart user.
 * Returns the signed token string.
 */
export function signToken(payload: Omit<AfriCartTokenPayload, keyof JwtPayload>): string {
  return jwt.sign(payload, ACTUAL_SECRET, DEFAULT_OPTIONS);
}

/**
 * Verify and decode an AfriCart JWT.
 * Returns the decoded payload, or null if the token is invalid/expired.
 */
export function verifyToken(token: string): AfriCartTokenPayload | null {
  try {
    return jwt.verify(token, ACTUAL_SECRET) as AfriCartTokenPayload;
  } catch {
    return null;
  }
}

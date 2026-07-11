import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

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
  if (!SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(payload, SECRET, DEFAULT_OPTIONS);
}

/**
 * Verify and decode an AfriCart JWT.
 * Returns the decoded payload, or null if the token is invalid/expired.
 */
export function verifyToken(token: string): AfriCartTokenPayload | null {
  if (!SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  try {
    return jwt.verify(token, SECRET) as AfriCartTokenPayload;
  } catch {
    return null;
  }
}

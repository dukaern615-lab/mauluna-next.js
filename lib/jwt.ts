import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'your-admin-secret-key-change-in-production';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: TokenPayload, isAdmin = false): string {
  const secret = isAdmin ? JWT_ADMIN_SECRET : JWT_SECRET;
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string, isAdmin = false): TokenPayload {
  const secret = isAdmin ? JWT_ADMIN_SECRET : JWT_SECRET;
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}


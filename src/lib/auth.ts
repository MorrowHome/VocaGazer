/**
 * JWT 认证工具函数
 */
import jwt from 'jsonwebtoken';

const DEV_FALLBACK = 'vocaloid-hub-dev-secret-2024';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('生产环境必须设置 JWT_SECRET（至少 16 位）');
  }
  return DEV_FALLBACK;
}

export interface JwtPayload {
  userId: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

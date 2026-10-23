import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import {
  findUserById,
  findUserByUsernameOrEmail,
  getOrCreateFirebaseUser,
} from '../db/queries.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'techpulse_production_hmac_sha256_secret_key_2026';

export interface AuthenticatedUserRecord {
  id: number;
  uid: string;
  username: string;
  passwordHash: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  role: string;
}

export interface AuthRequest extends Request {
  currentUser?: AuthenticatedUserRecord;
}

export function signJwt(user: { id: number; username: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyLocalJwtToken(
  token: string
): { id: number; username: string; role: string } | null {
  try {
    if (token.startsWith('tp_jwt_')) {
      return JSON.parse(Buffer.from(token.slice(7), 'base64url').toString('utf-8'));
    }
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function resolveUserFromRequest(
  req: Request
): Promise<AuthenticatedUserRecord | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  // 1. Check if it is a locally signed HMAC-SHA256 JWT token
  const localPayload = verifyLocalJwtToken(token);
  if (localPayload) {
    const byId = await findUserById(localPayload.id);
    if (byId) return byId;
    if (localPayload.username) {
      return await findUserByUsernameOrEmail(localPayload.username);
    }
    return null;
  }

  // 2. Otherwise verify as a Firebase ID Token via Firebase Admin SDK
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const syncedUser = await getOrCreateFirebaseUser(
      decodedToken.uid,
      decodedToken.email || `${decodedToken.uid}@firebase.user`,
      decodedToken.name
    );
    return syncedUser;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await resolveUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để thực hiện thao tác này!',
        data: null,
        timestamp: new Date().toISOString(),
      });
    }
    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Xác thực không hợp lệ hoặc đã hết hạn!',
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await resolveUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Yêu cầu đăng nhập tài khoản Quản trị viên!',
        data: null,
        timestamp: new Date().toISOString(),
      });
    }
    if (user.role !== 'ROLE_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền Quản trị viên (ROLE_ADMIN) để thực hiện thao tác này!',
        data: null,
        timestamp: new Date().toISOString(),
      });
    }
    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Không thể xác thực quyền Quản trị viên!',
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
};

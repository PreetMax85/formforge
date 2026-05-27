import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { tokenBlocklist } from '@repo/db/schema';
import { ApiError } from '@repo/shared';
import { env } from '../config/env';

interface TokenPayload {
  sub: string;
  type: string;
  jti: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required');
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

    if (payload.type !== 'access') {
      throw ApiError.unauthorized('Invalid token type');
    }

    const blocked = await db
      .select()
      .from(tokenBlocklist)
      .where(eq(tokenBlocklist.jti, payload.jti))
      .limit(1);

    if (blocked.length > 0) {
      throw ApiError.unauthorized('Token is revoked');
    }

    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    if (err instanceof jwt.TokenExpiredError) return next(ApiError.unauthorized('Token expired'));
    if (err instanceof jwt.JsonWebTokenError) return next(ApiError.unauthorized('Invalid token'));
    next(err);
  }
};

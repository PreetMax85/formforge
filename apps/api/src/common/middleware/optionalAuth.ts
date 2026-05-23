import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

interface TokenPayload {
  sub: string;
  type: string;
  jti: string;
  email: string;
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

    if (payload.type === 'access') {
      (req as unknown as Record<string, TokenPayload | undefined>).user = payload;
    }
  } catch {
    // Silently ignore — this is optional auth
  }

  next();
};

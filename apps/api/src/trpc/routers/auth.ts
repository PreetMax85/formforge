import type { Response } from 'express';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { SignupSchema, LoginSchema } from '@repo/shared';
import {
  createUser,
  loginUser,
  createTokens,
  saveSession,
  revokeSession,
  verifyRefreshToken,
  findSessionByHash,
  blockToken,
} from '../../modules/auth/auth.service.js';
import { AUTH_CONSTANTS } from '../../modules/auth/auth.constants.js';
import { ApiError } from '@repo/shared';
import { createHash } from 'crypto';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(AUTH_CONSTANTS.REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(AUTH_CONSTANTS.REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

const authRouter = router({
  signup: publicProcedure
    .input(SignupSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await createUser(input.email, input.name, input.password);
      const tokens = createTokens(user.id, user.email);
      await saveSession(user.id, tokens.refresh.token, tokens.refresh.jti, ctx.req.headers['user-agent']);
      setRefreshCookie(ctx.res, tokens.refresh.token);

      return {
        success: true as const,
        message: 'Account created successfully',
        data: {
          user: { id: user.id, email: user.email, name: user.name },
          accessToken: tokens.access.token,
        },
      };
    }),

  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await loginUser(input.email, input.password);
      const tokens = createTokens(user.id, user.email);
      await saveSession(user.id, tokens.refresh.token, tokens.refresh.jti, ctx.req.headers['user-agent']);
      setRefreshCookie(ctx.res, tokens.refresh.token);

      return {
        success: true as const,
        message: 'Login successful',
        data: {
          user: { id: user.id, email: user.email, name: user.name },
          accessToken: tokens.access.token,
        },
      };
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      const refreshToken = ctx.req.cookies?.[AUTH_CONSTANTS.REFRESH_COOKIE_NAME];
      if (refreshToken) {
        await revokeSession(refreshToken);
      }

      // Block the access token so it cannot be reused
      if (ctx.user?.jti) {
        await blockToken(ctx.user.jti, new Date(Date.now() + 15 * 60 * 1000));
      }

      clearRefreshCookie(ctx.res);

      return {
        success: true as const,
        message: 'Logged out successfully',
        data: null,
      };
    }),

  refresh: publicProcedure
    .query(async ({ ctx }) => {
      const refreshToken = ctx.req.cookies?.[AUTH_CONSTANTS.REFRESH_COOKIE_NAME];
      if (!refreshToken) {
        throw ApiError.unauthorized('No refresh token provided');
      }

      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        clearRefreshCookie(ctx.res);
        throw ApiError.unauthorized('Invalid refresh token');
      }

      if (payload.type !== 'refresh') {
        clearRefreshCookie(ctx.res);
        throw ApiError.unauthorized('Invalid token type');
      }

      const hashed = createHash('sha256').update(refreshToken).digest('hex');
      const session = await findSessionByHash(hashed);
      if (!session || session.expiresAt < new Date()) {
        clearRefreshCookie(ctx.res);
        throw ApiError.unauthorized('Session expired or not found');
      }

      // Rotate: create new tokens and save new session BEFORE revoking old one.
      // This makes rotation more resilient to duplicate requests.
      const tokens = createTokens(payload.sub, payload.email);
      await saveSession(payload.sub, tokens.refresh.token, tokens.refresh.jti, ctx.req.headers['user-agent']);
      setRefreshCookie(ctx.res, tokens.refresh.token);

      // Now safe to revoke the old session
      await revokeSession(refreshToken);

      return {
        success: true as const,
        message: 'Token refreshed',
        data: {
          accessToken: tokens.access.token,
        },
      };
    }),

  me: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        success: true as const,
        message: 'Current user',
        data: ctx.user,
      };
    }),
});

export { authRouter };

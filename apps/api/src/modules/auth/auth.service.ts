import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { db } from '../../common/db/index';
import { users, sessions, tokenBlocklist } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../../common/config/env';
import { AUTH_CONSTANTS } from './auth.constants';
import { ApiError } from '@repo/shared';
import { logger } from '../../common/logger';

interface TokenPayload {
  sub: string;
  type: string;
  jti: string;
  email: string;
}

function generateJti(): string {
  return createHash('sha256').update(`${Date.now()}-${crypto.randomUUID()}`).digest('hex').slice(0, 36);
}

function signAccessToken(payload: Omit<TokenPayload, 'jti' | 'type'>): { token: string; jti: string } {
  const jti = generateJti();
  const token = jwt.sign(
    { ...payload, type: 'access', jti },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
  return { token, jti };
}

function signRefreshToken(payload: { sub: string; email: string }): { token: string; jti: string } {
  const jti = generateJti();
  const token = jwt.sign(
    { ...payload, type: 'refresh', jti },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
  return { token, jti };
}

export async function createUser(email: string, name: string, password: string) {
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) throw ApiError.conflict('Email already registered');

  const passwordHash = await bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_ROUNDS);
  const [user] = await db.insert(users).values({ email, name, passwordHash }).returning();
  if (!user) throw ApiError.internal('Failed to create user');

  return user;
}

export async function loginUser(email: string, password: string) {
  // Retry up to 3 times for transient DB errors (e.g. Neon cold start)
  let user: typeof users.$inferSelect | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      user = rows[0];
      break;
    } catch (err) {
      if (attempt === 2) throw err;
      logger.warn({ err, attempt: attempt + 1 }, '[Auth] DB query failed, retrying...');
      await new Promise(r => setTimeout(r, 2_000));
    }
  }

  // Anti-enumeration: same error for wrong email and wrong password
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  return user;
}

export function createTokens(userId: string, email: string) {
  const access = signAccessToken({ sub: userId, email });
  const refresh = signRefreshToken({ sub: userId, email });
  return { access, refresh };
}

function parseExpiresIn(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 7 * 86_400 * 1000;
  const [, n, unit] = match;
  const multipliers: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return parseInt(n!) * (multipliers[unit!] ?? 86_400_000);
}

export async function saveSession(
  userId: string,
  refreshToken: string,
  refreshJti: string,
  userAgent?: string,
) {
  const expiresAt = new Date(Date.now() + parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN ?? '7d'));
  const hashed = createHash('sha256').update(refreshToken).digest('hex');

  await db.insert(sessions).values({
    userId,
    refreshToken: hashed,
    userAgent,
    expiresAt,
  });
}

export async function revokeSession(refreshToken: string) {
  const hashed = createHash('sha256').update(refreshToken).digest('hex');
  await db.delete(sessions).where(eq(sessions.refreshToken, hashed));
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export async function findSessionByHash(hashedToken: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.refreshToken, hashedToken))
    .limit(1);
  return session ?? null;
}

export async function blockToken(jti: string, expiresAt: Date) {
  await db.insert(tokenBlocklist).values({ jti, expiresAt }).onConflictDoNothing();
}

export async function validateSession(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  if (payload.type !== 'refresh') throw ApiError.unauthorized('Invalid token type');

  const hashed = createHash('sha256').update(refreshToken).digest('hex');
  const session = await findSessionByHash(hashed);
  if (!session || session.expiresAt < new Date()) {
    throw ApiError.unauthorized('Session expired or not found');
  }
  return payload;
}

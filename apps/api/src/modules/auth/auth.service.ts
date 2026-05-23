import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { db } from '../../common/db/index.js';
import { users, sessions, tokenBlocklist } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../../common/config/env.js';
import { AUTH_CONSTANTS } from './auth.constants.js';
import { ApiError } from '@repo/shared';

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
    { expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY }
  );
  return { token, jti };
}

function signRefreshToken(payload: { sub: string; email: string }): { token: string; jti: string } {
  const jti = generateJti();
  const token = jwt.sign(
    { ...payload, type: 'refresh', jti },
    env.JWT_REFRESH_SECRET,
    { expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY }
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
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

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

export async function saveSession(
  userId: string,
  refreshToken: string,
  refreshJti: string,
  userAgent?: string,
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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

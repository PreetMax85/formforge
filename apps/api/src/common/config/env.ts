import { z } from 'zod';

const envSchema = z.object({
  PORT:                   z.coerce.number().default(8080),
  NODE_ENV:               z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL:           z.string().startsWith('postgresql'),
  JWT_ACCESS_SECRET:      z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET:     z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN:  z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  APP_URL:                z.string().url(),
  RESEND_API_KEY:         z.string().optional(),
  SENTRY_DSN:             z.string().url().optional(),
  TURNSTILE_SECRET_KEY:   z.string().optional(),
  TURNSTILE_ENABLED:      z.coerce.boolean().default(false),
  COOKIE_DOMAIN:          z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('[ENV] Invalid environment variables:');
  console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = result.data;

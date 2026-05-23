import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema/index';

const neonClient = neon(process.env.DATABASE_URL!);

export const db = drizzle(neonClient, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export * from 'drizzle-orm';

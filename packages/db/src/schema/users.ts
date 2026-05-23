import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:           uuid('id').defaultRandom().primaryKey(),
  email:        varchar('email', { length: 255 }).notNull().unique(),
  name:         varchar('name',  { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  isAdmin:      boolean('is_admin').notNull().default(false),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
});

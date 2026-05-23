import {
  pgTable, uuid, varchar, text,
  boolean, timestamp,
} from 'drizzle-orm/pg-core';
import { forms } from './forms.js';

export const responses = pgTable('responses', {
  id:                      uuid('id').defaultRandom().primaryKey(),
  formId:                  uuid('form_id').notNull()
                             .references(() => forms.id, { onDelete: 'cascade' }),
  respondentEmail:         varchar('respondent_email', { length: 255 }),
  respondentName:          varchar('respondent_name',  { length: 255 }),
  ipAddress:               varchar('ip_address',       { length: 45  }),
  userAgent:               text('user_agent'),
  submissionHash:          varchar('submission_hash',  { length: 64 }),
  submissionHashExpiresAt: timestamp('submission_hash_expires_at'),
  emailCopySent:           boolean('email_copy_sent').notNull().default(false),
  completedAt:             timestamp('completed_at').notNull().defaultNow(),
  createdAt:               timestamp('created_at').notNull().defaultNow(),
});

import { pgTable, uuid, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';
import { forms } from './forms';

// One working copy per form. `content` is validated by DraftContentSchema
// in @repo/shared on every write; the database only stores it.
export const formDrafts = pgTable('form_drafts', {
  formId:            uuid('form_id').primaryKey()
                       .references(() => forms.id, { onDelete: 'cascade' }),
  content:           jsonb('content').notNull(),
  revision:          integer('revision').notNull().default(1),
  publishedRevision: integer('published_revision'),
  updatedAt:         timestamp('updated_at').notNull().defaultNow(),
});

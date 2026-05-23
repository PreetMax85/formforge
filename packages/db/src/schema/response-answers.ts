import { pgTable, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { responses } from './responses.js';
import { fields } from './fields.js';

export const responseAnswers = pgTable('response_answers', {
  id:         uuid('id').defaultRandom().primaryKey(),
  responseId: uuid('response_id').notNull()
                .references(() => responses.id, { onDelete: 'cascade' }),
  fieldId:    uuid('field_id').notNull()
                .references(() => fields.id,    { onDelete: 'cascade' }),
  value:      jsonb('value').notNull(),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
});

import { pgTable, uuid, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { responses } from './responses';
import { fields } from './fields';

export const responseAnswers = pgTable('response_answers', {
  id:         uuid('id').defaultRandom().primaryKey(),
  responseId: uuid('response_id').notNull()
                .references(() => responses.id, { onDelete: 'cascade' }),
  fieldId:    uuid('field_id').notNull()
                .references(() => fields.id,    { onDelete: 'cascade' }),
  value:      jsonb('value').notNull(),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('response_answers_response_field_idx').on(t.responseId, t.fieldId),
]);

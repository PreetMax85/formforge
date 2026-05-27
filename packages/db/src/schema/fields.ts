import {
  pgTable, pgEnum, uuid, varchar, text,
  boolean, integer, jsonb, timestamp, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { forms } from './forms';

export const fieldTypeEnum = pgEnum('field_type', [
  'short_text', 'long_text', 'email', 'number',
  'single_select', 'multi_select', 'checkbox',
  'rating', 'date', 'dropdown',
]);

export const fields = pgTable('fields', {
  id:          uuid('id').defaultRandom().primaryKey(),
  formId:      uuid('form_id').notNull()
                 .references(() => forms.id, { onDelete: 'cascade' }),
  type:        fieldTypeEnum('type').notNull(),
  label:       varchar('label',       { length: 500 }).notNull(),
  placeholder: varchar('placeholder', { length: 500 }),
  description: text('description'),
  required:    boolean('required').notNull().default(false),
  order:       integer('order').notNull().default(0),
  config:      jsonb('config').notNull().default({}),
  conditions:  jsonb('conditions'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('fields_form_id_order_idx').on(t.formId, t.order),
]);

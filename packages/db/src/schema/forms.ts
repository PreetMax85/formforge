import {
  pgTable, pgEnum, uuid, varchar, text,
  boolean, timestamp, integer,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const formVisibilityEnum = pgEnum('form_visibility', ['public', 'unlisted']);
export const formStatusEnum     = pgEnum('form_status',     ['draft', 'published', 'archived']);

export const forms = pgTable('forms', {
  id:              uuid('id').defaultRandom().primaryKey(),
  creatorId:       uuid('creator_id').notNull()
                     .references(() => users.id, { onDelete: 'cascade' }),
  title:           varchar('title',       { length: 255 }).notNull(),
  description:     text('description'),
  slug:            varchar('slug',        { length: 100 }).notNull().unique(),
  status:          formStatusEnum('status').notNull().default('draft'),
  visibility:      formVisibilityEnum('visibility').notNull().default('unlisted'),
  theme:           varchar('theme',       { length: 100 }).notNull().default('default'),
  allowAnonymous:  boolean('allow_anonymous').notNull().default(true),
  requireEmail:    boolean('require_email').notNull().default(false),
  showProgressBar: boolean('show_progress_bar').notNull().default(true),
  notifyCreator:   boolean('notify_creator').notNull().default(true),
  responseCount:   integer('response_count').notNull().default(0),
  viewCount:       integer('view_count').notNull().default(0),
  thankYouTitle:   varchar('thank_you_title',   { length: 255 }).default('Thank you!'),
  thankYouMessage: text('thank_you_message').default('Your response has been recorded.'),
  maxResponses:    integer('max_responses'),
  expiresAt:       timestamp('expires_at'),
  passwordHash:    text('password_hash'),
  publishedAt:     timestamp('published_at'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
});

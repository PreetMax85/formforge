import { relations } from 'drizzle-orm';

import { users } from './users';
import { sessions } from './sessions';
import { tokenBlocklist } from './token-blocklist';
import { forms } from './forms';
import { fields } from './fields';
import { responses } from './responses';
import { responseAnswers } from './response-answers';

export const usersRelations = relations(users, ({ many }) => ({
  forms:    many(forms),
  sessions: many(sessions),
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
  creator:   one(users, { fields: [forms.creatorId], references: [users.id] }),
  fields:    many(fields),
  responses: many(responses),
}));

export const fieldsRelations = relations(fields, ({ one }) => ({
  form: one(forms, { fields: [fields.formId], references: [forms.id] }),
}));

export const responsesRelations = relations(responses, ({ one, many }) => ({
  form:    one(forms, { fields: [responses.formId], references: [forms.id] }),
  answers: many(responseAnswers),
}));

export const responseAnswersRelations = relations(responseAnswers, ({ one }) => ({
  response: one(responses, { fields: [responseAnswers.responseId], references: [responses.id] }),
  field:    one(fields,    { fields: [responseAnswers.fieldId],    references: [fields.id]    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export { users, sessions, tokenBlocklist, forms, fields, responses, responseAnswers };

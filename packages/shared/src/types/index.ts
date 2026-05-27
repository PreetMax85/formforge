import type { InferSelectModel } from 'drizzle-orm';
import type { forms, fields, responses, responseAnswers } from '@repo/db/schema';

export type Form           = InferSelectModel<typeof forms>;
export type Field          = InferSelectModel<typeof fields>;
export type Response       = InferSelectModel<typeof responses>;
export type ResponseAnswer = InferSelectModel<typeof responseAnswers>;

export type FormWithFields = Form & { fields: Field[] };
export type ResponseWithAnswers = Response & { answers: ResponseAnswer[] };

export type { DropoffRow, FunnelStage, FormInsight, FormStats, FormAnalyticsStats } from './analytics';

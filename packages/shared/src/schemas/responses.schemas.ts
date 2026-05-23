import { z } from 'zod';

export const AnswerSchema = z.object({
  fieldId: z.string().uuid(),
  value:   z.union([z.array(z.string().max(500)).max(50), z.string().max(10000)]),
});

export const SubmitResponseSchema = z.object({
  formSlug:        z.string(),
  answers:         z.array(AnswerSchema).min(1).max(50),
  respondentEmail: z.string().email().optional(),
  respondentName:  z.string().max(255).optional(),
  sendEmailCopy:   z.boolean().default(false),
  turnstileToken:  z.string().optional(),
  _hp:             z.string().max(0, 'Bot detected').optional(),
});

export const ListResponsesSchema = z.object({
  formId: z.string().uuid(),
  limit:  z.number().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

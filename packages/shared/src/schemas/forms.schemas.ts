import { z } from 'zod';

export const FORM_THEMES = [
  'default', 'ghost-of-tsushima', 'jujutsu-kaisen',
  'karan-aujla-concert', 'cyberpunk', 'matrix', 'synthwave', 'minimal',
] as const;

export const CreateFormSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  slug:        z.string().min(3).max(100)
                 .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens')
                 .optional(),
  theme:       z.enum(FORM_THEMES).default('default'),
});

export const UpdateFormSchema = z.object({
  id:              z.string().uuid(),
  slug:            z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens').optional(),
  visibility:      z.enum(['public', 'unlisted']).optional(),
  notifyCreator:   z.boolean().optional(),
  showProgressBar: z.boolean().optional(),
  maxResponses:    z.number().int().positive().optional(),
  expiresAt:       z.string().datetime().optional(),
});

export const PublishFormSchema = z.object({
  id:         z.string().uuid(),
  visibility: z.enum(['public', 'unlisted']),
});

export const ExploreSchema = z.object({
  search: z.string().max(100).optional(),
  theme:  z.enum(FORM_THEMES).optional(),
  limit:  z.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

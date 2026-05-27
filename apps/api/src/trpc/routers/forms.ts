import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { CreateFormSchema, UpdateFormSchema, PublishFormSchema, ExploreSchema, ApiError } from '@repo/shared';
import {
  createForm,
  getFormById,
  getFormBySlug,
  getFormsByCreator,
  updateForm,
  deleteForm,
  archiveForm,
  publishForm,
  unpublishForm,
  cloneForm,
  exploreForms,
  incrementViewCount,
} from '../../modules/forms/forms.service';

// Explicit output envelope to avoid z.any()
const successEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
  });

const fieldObjectSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  type: z.enum([
    'short_text', 'long_text', 'email', 'number',
    'single_select', 'multi_select', 'checkbox',
    'rating', 'date', 'dropdown',
  ]),
  label: z.string(),
  placeholder: z.string().nullable(),
  description: z.string().nullable(),
  required: z.boolean(),
  order: z.number(),
  config: z.unknown(),
  conditions: z.unknown().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const formObjectSchema = z.object({
  id: z.string().uuid(),
  creatorId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  visibility: z.enum(['public', 'unlisted']),
  theme: z.string(),
  allowAnonymous: z.boolean(),
  requireEmail: z.boolean(),
  showProgressBar: z.boolean(),
  notifyCreator: z.boolean(),
  responseCount: z.number(),
  viewCount: z.number(),
  thankYouTitle: z.string().nullable(),
  thankYouMessage: z.string().nullable(),
  maxResponses: z.number().nullable(),
  expiresAt: z.date().nullable(),
  passwordHash: z.string().nullable(),
  publishedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const formDetailSchema = formObjectSchema.extend({
  fields: z.array(fieldObjectSchema),
});

const formsListSchema = z.object({
  items: z.array(formObjectSchema),
});

const safeFormOutputSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: z.string(),
  visibility: z.string(),
  theme: z.string(),
  allowAnonymous: z.boolean(),
  requireEmail: z.boolean(),
  showProgressBar: z.boolean(),
  notifyCreator: z.boolean(),
  responseCount: z.number(),
  viewCount: z.number(),
  thankYouTitle: z.string().nullable(),
  thankYouMessage: z.string().nullable(),
  maxResponses: z.number().nullable(),
  expiresAt: z.unknown().nullable(),
  passwordHash: z.string().nullable(),
  publishedAt: z.unknown().nullable(),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
});

const exploreOutputSchema = z.object({
  items: z.array(safeFormOutputSchema),
  nextCursor: z.string().nullable(),
});

const publicFormOutputSchema = safeFormOutputSchema.extend({
  fields: z.array(z.unknown()),
});

const exploreResultSchema = z.object({
  items: z.array(formObjectSchema),
  nextCursor: z.string().uuid().nullable(),
});

const publicFormDetailSchema = formObjectSchema.omit({ passwordHash: true }).extend({
  fields: z.array(fieldObjectSchema),
});

const formsRouter = router({
  bySlug: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/forms/{slug}' } })
    .input(z.object({ slug: z.string() }))
    .output(successEnvelope(publicFormDetailSchema))
    .query(async ({ input }) => {
      const form = await getFormBySlug(input.slug);
      if (form.status !== 'published') throw ApiError.notFound('Form not found');
      return { success: true as const, message: 'Form found', data: form };
    }),

  incrementView: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/forms/{slug}/view' } })
    .input(z.object({ slug: z.string() }))
    .output(successEnvelope(z.null()))
    .mutation(async ({ input }) => {
      const form = await getFormBySlug(input.slug);
      if (form.status !== 'published') throw ApiError.notFound('Form not found');
      await incrementViewCount(form.id);
      return { success: true as const, message: 'OK', data: null };
    }),

  explore: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/forms/explore' } })
    .input(ExploreSchema)
    .output(successEnvelope(exploreOutputSchema))
    .query(async ({ input }) => {
      const result = await exploreForms(input);
      return { success: true as const, message: 'Forms found', data: result };
    }),

  create: protectedProcedure
    .input(CreateFormSchema)
    .mutation(async ({ input, ctx }) => {
      const form = await createForm(input, ctx.user.sub);
      return { success: true as const, message: 'Form created', data: form };
    }),

  update: protectedProcedure
    .input(UpdateFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...rest } = input;
      const form = await updateForm(id, rest, ctx.user.sub);
      return { success: true as const, message: 'Form updated', data: form };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await deleteForm(input.id, ctx.user.sub);
      return { success: true as const, message: 'Form deleted', data: null };
    }),

  publish: protectedProcedure
    .input(PublishFormSchema)
    .mutation(async ({ input, ctx }) => {
      const form = await publishForm(input.id, input.visibility, ctx.user.sub);
      return { success: true as const, message: 'Form published', data: form };
    }),

  unpublish: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const form = await unpublishForm(input.id, ctx.user.sub);
      return { success: true as const, message: 'Form unpublished', data: form };
    }),

  clone: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const cloned = await cloneForm(input.id, ctx.user.sub);
      return { success: true as const, message: 'Form cloned', data: cloned };
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const form = await archiveForm(input.id, ctx.user.sub);
      return { success: true as const, message: 'Form archived', data: form };
    }),

  myForms: protectedProcedure
    .query(async ({ ctx }) => {
      const items = await getFormsByCreator(ctx.user.sub);
      return { success: true as const, message: 'Forms found', data: { items } };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const form = await getFormById(input.id, ctx.user.sub);
      return { success: true as const, message: 'Form found', data: form };
    }),

  exportCsv: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await getFormById(input.id, ctx.user.sub);
      throw ApiError.internal('CSV export not yet implemented');
    }),
});

export { formsRouter };

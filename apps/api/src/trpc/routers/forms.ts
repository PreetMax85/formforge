import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { CreateFormSchema, UpdateFormSchema, PublishFormSchema, ExploreSchema } from '@repo/shared';
import {
  createForm,
  getFormById,
  getFormBySlug,
  getFormsByCreator,
  updateForm,
  deleteForm,
  publishForm,
  unpublishForm,
  exploreForms,
} from '../../modules/forms/forms.service.js';

// Explicit output envelope to avoid z.any()
const successEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
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
  responseCount: z.number(),
  viewCount: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const formsListSchema = z.object({
  items: z.array(formObjectSchema),
});

const exploreResultSchema = z.object({
  items: z.array(formObjectSchema),
  nextCursor: z.string().uuid().nullable(),
});

const formsRouter = router({
  bySlug: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/forms/{slug}' } })
    .input(z.object({ slug: z.string() }))
    .output(successEnvelope(formObjectSchema))
    .query(async ({ input }) => {
      const form = await getFormBySlug(input.slug);
      return { success: true as const, message: 'Form found', data: form };
    }),

  explore: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/forms/explore' } })
    .input(ExploreSchema)
    .output(successEnvelope(exploreResultSchema))
    .query(async ({ input }) => {
      const result = await exploreForms(input);
      return { success: true as const, message: 'Forms found', data: result };
    }),

  create: protectedProcedure
    .input(CreateFormSchema)
    .output(successEnvelope(formObjectSchema))
    .mutation(async ({ input, ctx }) => {
      const form = await createForm(input, ctx.user.sub);
      return { success: true as const, message: 'Form created', data: form };
    }),

  update: protectedProcedure
    .input(UpdateFormSchema)
    .output(successEnvelope(formObjectSchema))
    .mutation(async ({ input, ctx }) => {
      const { id, ...rest } = input;
      const form = await updateForm(id, rest, ctx.user.sub);
      return { success: true as const, message: 'Form updated', data: form };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(successEnvelope(z.null()))
    .mutation(async ({ input, ctx }) => {
      await deleteForm(input.id, ctx.user.sub);
      return { success: true as const, message: 'Form deleted', data: null };
    }),

  publish: protectedProcedure
    .input(PublishFormSchema)
    .output(successEnvelope(formObjectSchema))
    .mutation(async ({ input, ctx }) => {
      const form = await publishForm(input.id, input.visibility, ctx.user.sub);
      return { success: true as const, message: 'Form published', data: form };
    }),

  unpublish: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(successEnvelope(formObjectSchema))
    .mutation(async ({ input, ctx }) => {
      const form = await unpublishForm(input.id, ctx.user.sub);
      return { success: true as const, message: 'Form unpublished', data: form };
    }),

  clone: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(successEnvelope(formObjectSchema))
    .mutation(async ({ input, ctx }) => {
      const original = await getFormById(input.id, ctx.user.sub);
      const cloned = await createForm(
        {
          title: `${original.title} (Copy)`,
          description: original.description ?? undefined,
          theme: original.theme as 'default' | 'ghost-of-tsushima' | 'jujutsu-kaisen' | 'karan-aujla-concert' | 'cyberpunk' | 'matrix' | 'synthwave' | 'minimal',
        },
        ctx.user.sub,
      );
      return { success: true as const, message: 'Form cloned', data: cloned };
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(successEnvelope(z.null()))
    .mutation(async ({ input, ctx }) => {
      await deleteForm(input.id, ctx.user.sub);
      return { success: true as const, message: 'Form archived', data: null };
    }),

  myForms: protectedProcedure
    .output(successEnvelope(formsListSchema))
    .query(async ({ ctx }) => {
      const items = await getFormsByCreator(ctx.user.sub);
      return { success: true as const, message: 'Forms found', data: { items } };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(successEnvelope(formObjectSchema))
    .query(async ({ input, ctx }) => {
      const form = await getFormById(input.id, ctx.user.sub);
      return { success: true as const, message: 'Form found', data: form };
    }),

  exportCsv: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(successEnvelope(z.string()))
    .query(async ({ input }) => {
      return { success: true as const, message: 'CSV export — scaffolded', data: '' };
    }),
});

export { formsRouter };

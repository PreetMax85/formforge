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

const formsRouter = router({
  bySlug: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/forms/{slug}' } })
    .input(z.object({ slug: z.string() }))
    .output(z.any())
    .query(async ({ input }) => {
      const form = await getFormBySlug(input.slug);
      return { success: true, message: 'Form found', data: form };
    }),

  explore: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/forms/explore' } })
    .input(ExploreSchema)
    .output(z.any())
    .query(async ({ input }) => {
      const result = await exploreForms(input);
      return { success: true, message: 'Forms found', data: result };
    }),

  create: protectedProcedure
    .input(CreateFormSchema)
    .mutation(async ({ input, ctx }) => {
      const form = await createForm(input, ctx.user.sub);
      return { success: true, message: 'Form created', data: form };
    }),

  update: protectedProcedure
    .input(UpdateFormSchema)
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      const form = await updateForm(id, rest);
      return { success: true, message: 'Form updated', data: form };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await deleteForm(input.id);
      return { success: true, message: 'Form deleted', data: null };
    }),

  publish: protectedProcedure
    .input(PublishFormSchema)
    .mutation(async ({ input }) => {
      const form = await publishForm(input.id, input.visibility);
      return { success: true, message: 'Form published', data: form };
    }),

  unpublish: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const form = await unpublishForm(input.id);
      return { success: true, message: 'Form unpublished', data: form };
    }),

  clone: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const original = await getFormById(input.id);
      const cloned = await createForm(
        {
          title: `${original.title} (Copy)`,
          description: original.description ?? undefined,
          theme: original.theme as any,
        },
        ctx.user.sub,
      );
      return { success: true, message: 'Form cloned', data: cloned };
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const form = await updateForm(input.id, { title: undefined });
      await deleteForm(input.id);
      return { success: true, message: 'Form archived', data: null };
    }),

  myForms: protectedProcedure
    .query(async ({ ctx }) => {
      const items = await getFormsByCreator(ctx.user.sub);
      return { success: true, message: 'Forms found', data: { items } };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const form = await getFormById(input.id);
      return { success: true, message: 'Form found', data: form };
    }),

  exportCsv: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return { success: true, message: 'CSV export — scaffolded', data: '' };
    }),
});

export { formsRouter };

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { CreateFormSchema, UpdateFormSchema, PublishFormSchema, ExploreSchema } from '@repo/shared';

const formsRouter = router({
  bySlug: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/forms/{slug}' } })
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return { success: true, message: 'Form by slug — scaffolded', data: input.slug };
    }),

  explore: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/forms/explore' } })
    .input(ExploreSchema)
    .query(async ({ input }) => {
      return { success: true, message: 'Explore — scaffolded', data: { items: [], nextCursor: null } };
    }),

  create: protectedProcedure
    .input(CreateFormSchema)
    .mutation(async ({ input }) => {
      return { success: true, message: 'Form created — scaffolded', data: input };
    }),

  update: protectedProcedure
    .input(UpdateFormSchema)
    .mutation(async ({ input }) => {
      return { success: true, message: 'Form updated — scaffolded', data: input };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Form deleted', data: null };
    }),

  publish: protectedProcedure
    .input(PublishFormSchema)
    .mutation(async ({ input }) => {
      return { success: true, message: 'Form published — scaffolded', data: input };
    }),

  unpublish: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Form unpublished', data: null };
    }),

  clone: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Form cloned — scaffolded', data: null };
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Form archived', data: null };
    }),

  myForms: protectedProcedure
    .query(async ({ ctx }) => {
      return { success: true, message: 'My forms — scaffolded', data: { items: [] } };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return { success: true, message: 'Form by ID — scaffolded', data: null };
    }),

  exportCsv: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return { success: true, message: 'CSV export — scaffolded', data: '' };
    }),
});

export { formsRouter };

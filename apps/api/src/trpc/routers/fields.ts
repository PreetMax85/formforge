import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { UpsertFieldsSchema, ReorderFieldsSchema } from '@repo/shared';

const fieldsRouter = router({
  upsertMany: protectedProcedure
    .input(UpsertFieldsSchema)
    .mutation(async ({ input }) => {
      return { success: true, message: 'Fields upserted — scaffolded', data: input };
    }),

  reorder: protectedProcedure
    .input(ReorderFieldsSchema)
    .mutation(async ({ input }) => {
      return { success: true, message: 'Fields reordered — scaffolded', data: input };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return { success: true, message: 'Field deleted', data: null };
    }),
});

export { fieldsRouter };

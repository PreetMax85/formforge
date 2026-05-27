import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { UpsertFieldsSchema, ReorderFieldsSchema } from '@repo/shared';
import {
  upsertFieldsForForm,
  reorderFields,
  deleteField,
  verifyFieldOwnership,
} from '../../modules/fields/fields.service';
import { assertFormOwner } from '../utils/ownership';

const fieldsRouter = router({
  upsertMany: protectedProcedure
    .input(UpsertFieldsSchema)
    .mutation(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const result = await upsertFieldsForForm(input.formId, input.fields);
      return { success: true as const, message: 'Fields saved', data: { fields: result } };
    }),

  reorder: protectedProcedure
    .input(ReorderFieldsSchema)
    .mutation(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      await reorderFields(input.formId, input.fields);
      return { success: true as const, message: 'Fields reordered', data: null };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await verifyFieldOwnership(input.id, ctx.user.sub);
      await deleteField(input.id);
      return { success: true as const, message: 'Field deleted', data: null };
    }),
});

export { fieldsRouter };

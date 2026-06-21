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
    .meta({ openapi: { method: 'POST', path: '/fields/upsert', tags: ['Fields'], description: 'Bulk upsert fields for a form (insert new, update existing by ID).' } })
    .input(UpsertFieldsSchema)
    .mutation(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      const result = await upsertFieldsForForm(input.formId, input.fields);
      return { success: true as const, message: 'Fields saved', data: { fields: result } };
    }),

  reorder: protectedProcedure
    .meta({ openapi: { method: 'POST', path: '/fields/reorder', tags: ['Fields'], description: 'Reorder fields by providing an array of { id, order } pairs.' } })
    .input(ReorderFieldsSchema)
    .mutation(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.sub);
      await reorderFields(input.formId, input.fields);
      return { success: true as const, message: 'Fields reordered', data: null };
    }),

  delete: protectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/fields/{id}', tags: ['Fields'], description: 'Delete a single field by ID.' } })
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await verifyFieldOwnership(input.id, ctx.user.sub);
      await deleteField(input.id);
      return { success: true as const, message: 'Field deleted', data: null };
    }),
});

export { fieldsRouter };

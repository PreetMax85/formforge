import { router, protectedProcedure } from '../trpc';
import { GetDraftSchema, SaveDraftSchema, DiscardDraftSchema } from '@repo/shared';
import { getDraft, saveDraft, discardDraft } from '../../modules/drafts/drafts.service';

const draftsRouter = router({
  get: protectedProcedure
    .meta({ openapi: { enabled: false, method: 'GET', path: '/drafts/{formId}', tags: ['Drafts'], description: 'Load the working draft of a form (owner only).' } })
    .input(GetDraftSchema)
    .query(async ({ input, ctx }) => {
      const draft = await getDraft(input.formId, ctx.user.sub);
      return { success: true as const, message: 'Draft found', data: draft };
    }),

  save: protectedProcedure
    .meta({ openapi: { enabled: false, method: 'PUT', path: '/drafts/{formId}', tags: ['Drafts'], description: 'Autosave the draft if it has not changed since baseRevision.' } })
    .input(SaveDraftSchema)
    .mutation(async ({ input, ctx }) => {
      const saved = await saveDraft(input.formId, input.baseRevision, input.content, ctx.user.sub);
      return { success: true as const, message: 'Draft saved', data: saved };
    }),

  discard: protectedProcedure
    .meta({ openapi: { enabled: false, method: 'POST', path: '/drafts/{formId}/discard', tags: ['Drafts'], description: 'Reset the draft to the published form.' } })
    .input(DiscardDraftSchema)
    .mutation(async ({ input, ctx }) => {
      const draft = await discardDraft(input.formId, input.baseRevision, ctx.user.sub);
      return { success: true as const, message: 'Changes discarded', data: draft };
    }),
});

export { draftsRouter };

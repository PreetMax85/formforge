import { eq } from 'drizzle-orm';
import { forms } from '@repo/db/schema';
import { ApiError } from '@repo/shared';
import { db } from '../../common/db/index';

/** Verify a form exists and belongs to the requesting user. Throws ApiError otherwise. */
export async function assertFormOwner(formId: string, userId: string): Promise<void> {
  const [form] = await db
    .select({ creatorId: forms.creatorId })
    .from(forms)
    .where(eq(forms.id, formId))
    .limit(1);
  if (!form)                     throw ApiError.notFound('Form not found');
  if (form.creatorId !== userId) throw ApiError.forbidden();
}

import { db } from '../../common/db/index.js';
import { fields, forms } from '@repo/db/schema';
import { eq, asc } from 'drizzle-orm';
import { ApiError } from '@repo/shared';

export async function getFormFields(formId: string) {
  return db
    .select()
    .from(fields)
    .where(eq(fields.formId, formId))
    .orderBy(asc(fields.order));
}

export async function verifyFieldOwnership(fieldId: string, creatorId: string) {
  const [result] = await db
    .select({ formId: fields.formId, creatorId: forms.creatorId })
    .from(fields)
    .innerJoin(forms, eq(fields.formId, forms.id))
    .where(eq(fields.id, fieldId))
    .limit(1);

  if (!result) throw ApiError.notFound('Field not found');
  if (result.creatorId !== creatorId) throw ApiError.forbidden('Not authorized to modify this field');
  return result;
}

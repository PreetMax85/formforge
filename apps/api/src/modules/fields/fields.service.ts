import { db } from '../../common/db/index';
import { fields, forms } from '@repo/db/schema';
import { eq, asc, inArray, and } from 'drizzle-orm';
import { ApiError } from '@repo/shared';
import type { Field } from '@repo/shared';
import type { z } from 'zod';
import type {
  UpsertFieldsSchema,
  ReorderFieldsSchema,
  ConditionalLogicSchema,
} from '@repo/shared';

type UpsertFieldsInput  = z.infer<typeof UpsertFieldsSchema>;
type ReorderFieldsInput = z.infer<typeof ReorderFieldsSchema>;
type ConditionalLogic   = z.infer<typeof ConditionalLogicSchema>;

export async function getFormFields(formId: string): Promise<Field[]> {
  return db
    .select()
    .from(fields)
    .where(eq(fields.formId, formId))
    .orderBy(asc(fields.order));
}

/** Verify a field exists and the requesting user owns its parent form. */
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

/**
 * Atomic PUT of a form's full field set. Classifies the payload into UPDATE
 * (id matches an existing row), INSERT (no id), and DELETE (existing row not
 * present in payload). Returns the canonical post-write field list, ordered
 * by `order` ASC so the client can replace local state by index.
 *
 * Note: deleting a field cascades to its response_answers via FK. That's
 * intentional — removing a field from a form means historical answers for
 * that field also disappear from the response detail view.
 */
export async function upsertFieldsForForm(
  formId: string,
  payload: UpsertFieldsInput['fields'],
): Promise<Field[]> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: fields.id })
      .from(fields)
      .where(eq(fields.formId, formId));

    const existingIds = new Set(existing.map((f) => f.id));
    const payloadIds  = new Set(
      payload.map((f) => f.id).filter((id): id is string => typeof id === 'string'),
    );
    const toDelete = [...existingIds].filter((id) => !payloadIds.has(id));

    for (const f of payload) {
      const row = {
        formId,
        type:        f.type,
        label:       f.label,
        placeholder: f.placeholder ?? null,
        description: f.description ?? null,
        required:    f.required,
        order:       f.order,
        config:      f.config,
        conditions:  (f.conditions ?? null) as ConditionalLogic | null,
        updatedAt:   new Date(),
      };

      if (f.id && existingIds.has(f.id)) {
        await tx.update(fields).set(row).where(eq(fields.id, f.id));
      } else {
        await tx.insert(fields).values(row);
      }
    }

    if (toDelete.length > 0) {
      await tx.delete(fields).where(inArray(fields.id, toDelete));
    }

    return tx
      .select()
      .from(fields)
      .where(eq(fields.formId, formId))
      .orderBy(asc(fields.order));
  });
}

/**
 * Bulk reorder. Updates `order` for matching field IDs scoped to the form.
 * Unknown IDs (e.g. client-side temp IDs that haven't been saved yet) are
 * silently skipped — they no-op on the server but the client still has its
 * own optimistic ordering in local state.
 */
export async function reorderFields(
  formId: string,
  orders: ReorderFieldsInput['fields'],
): Promise<void> {
  // Filter to only DB-shaped UUIDs; temp IDs from the client are no-ops here.
  const uuidLike = orders.filter((o) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(o.id));
  if (uuidLike.length === 0) return;

  await db.transaction(async (tx) => {
    for (const { id, order } of uuidLike) {
      await tx
        .update(fields)
        .set({ order, updatedAt: new Date() })
        .where(and(eq(fields.id, id), eq(fields.formId, formId)));
    }
  });
}

/** Delete a single field. Caller must verify ownership beforehand. */
export async function deleteField(fieldId: string): Promise<void> {
  await db.delete(fields).where(eq(fields.id, fieldId));
}

import { randomUUID } from 'crypto';
import { db } from '../../common/db/index';
import { forms, fields } from '@repo/db/schema';
import { eq, desc, sql, and, gt, lt, or, like, asc } from 'drizzle-orm';
import { ApiError } from '@repo/shared';
import type { z } from 'zod';
import type { CreateFormSchema, UpdateFormSchema } from '@repo/shared';
import { logger } from '../../common/logger'

/**
 * Generates a URL-safe slug from a base title. Handles collisions by
 * appending nanoid(4) suffixes. Retries up to 5 times before falling
 * back to a random nanoid(12).
 */
export async function generateUniqueSlug(baseTitle: string): Promise<string> {
  const { nanoid } = await import('nanoid');

  const base = baseTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  const existing = await db
    .select({ slug: forms.slug })
    .from(forms)
    .where(eq(forms.slug, base))
    .limit(1);

  if (existing.length === 0) return base;

  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${nanoid(4)}`.toLowerCase();
    const collision = await db
      .select({ slug: forms.slug })
      .from(forms)
      .where(eq(forms.slug, candidate))
      .limit(1);
    if (collision.length === 0) return candidate;
  }

  return nanoid(12).toLowerCase();
}

/**
 * Checks if a custom slug is available. Returns managed error if taken.
 */
export async function checkSlugAvailability(slug: string): Promise<void> {
  const existing = await db
    .select({ slug: forms.slug })
    .from(forms)
    .where(eq(forms.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    throw ApiError.conflict('This URL is taken. Try a different one or leave it blank for auto-generation.');
  }
}

export async function createForm(
  input: z.infer<typeof CreateFormSchema>,
  creatorId: string,
) {
  const slug = input.slug ?? await generateUniqueSlug(input.title);
  if (input.slug) await checkSlugAvailability(input.slug);

  const [form] = await db
    .insert(forms)
    .values({
      creatorId,
      title: input.title,
      description: input.description,
      slug,
      theme: input.theme ?? 'default',
    })
    .returning();

  if (!form) throw ApiError.internal('Failed to create form');
  return form;
}

export async function getFormById(id: string, requesterId?: string) {
  const [form] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!form) throw ApiError.notFound('Form not found');
  if (requesterId && form.creatorId !== requesterId) {
    throw ApiError.forbidden('You do not have access to this form');
  }
  const formFields = await db
    .select()
    .from(fields)
    .where(eq(fields.formId, id))
    .orderBy(asc(fields.order));
  return { ...form, fields: formFields };
}

export async function getFormBySlug(slug: string) {
  // No status filter here — callers (public f/[slug] page and responses.submit)
  // gate on status='published' themselves. This allows owner preview-by-slug
  // and avoids leaking 404 vs 403 information to the public form page.
  const [form] = await db
    .select()
    .from(forms)
    .where(eq(forms.slug, slug))
    .limit(1);
  if (!form) throw ApiError.notFound('Form not found');

  const formFields = await db
    .select()
    .from(fields)
    .where(eq(fields.formId, form.id))
    .orderBy(asc(fields.order));

  return { ...form, fields: formFields };
}

export async function getFormsByCreator(creatorId: string) {
  return db
    .select()
    .from(forms)
    .where(eq(forms.creatorId, creatorId))
    .orderBy(desc(forms.createdAt));
}

export async function updateForm(
  id: string,
  input: Omit<z.infer<typeof UpdateFormSchema>, 'id'>,
  requesterId: string,
) {
  const [existing] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!existing) throw ApiError.notFound('Form not found');
  if (existing.creatorId !== requesterId) {
    throw ApiError.forbidden('You do not have permission to update this form');
  }

  if (input.slug !== undefined && input.slug !== existing.slug) {
    await checkSlugAvailability(input.slug);
  }

  const [updated] = await db
    .update(forms)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.theme !== undefined && { theme: input.theme }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      ...(input.notifyCreator !== undefined && { notifyCreator: input.notifyCreator }),
      ...(input.showProgressBar !== undefined && { showProgressBar: input.showProgressBar }),
      ...(input.thankYouTitle !== undefined && { thankYouTitle: input.thankYouTitle }),
      ...(input.thankYouMessage !== undefined && { thankYouMessage: input.thankYouMessage }),
      ...(input.maxResponses !== undefined && { maxResponses: input.maxResponses }),
      ...(input.expiresAt !== undefined && { expiresAt: new Date(input.expiresAt) }),
      updatedAt: new Date(),
    })
    .where(eq(forms.id, id))
    .returning();

  if (!updated) throw ApiError.internal('Failed to update form');
  return updated;
}

export async function archiveForm(id: string, requesterId: string) {
  const [existing] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!existing) throw ApiError.notFound('Form not found');
  if (existing.creatorId !== requesterId) {
    throw ApiError.forbidden('You do not have permission to archive this form');
  }
  const [updated] = await db
    .update(forms)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(forms.id, id))
    .returning();
  if (!updated) throw ApiError.internal('Failed to archive form');
  return updated;
}

export async function deleteForm(id: string, requesterId: string) {
  const [existing] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!existing) throw ApiError.notFound('Form not found');
  if (existing.creatorId !== requesterId) {
    throw ApiError.forbidden('You do not have permission to delete this form');
  }
  await db.delete(forms).where(eq(forms.id, id));
}

export async function publishForm(id: string, visibility: 'public' | 'unlisted', requesterId: string) {
  const [existing] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!existing) throw ApiError.notFound('Form not found');
  if (existing.creatorId !== requesterId) {
    throw ApiError.forbidden('You do not have permission to publish this form');
  }

  const [updated] = await db
    .update(forms)
    .set({
      status: 'published',
      visibility,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(forms.id, id))
    .returning();

  if (!updated) throw ApiError.internal('Failed to publish form');
  return updated;
}

export async function unpublishForm(id: string, requesterId: string) {
  const [existing] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!existing) throw ApiError.notFound('Form not found');
  if (existing.creatorId !== requesterId) {
    throw ApiError.forbidden('You do not have permission to unpublish this form');
  }

  const [updated] = await db
    .update(forms)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(eq(forms.id, id))
    .returning();

  if (!updated) throw ApiError.internal('Failed to unpublish form');
  return updated;
}

export async function exploreForms(
  opts: {
    search?: string;
    theme?: string;
    limit: number;
    cursor?: string;
  },
) {
  const conditions = [eq(forms.status, 'published'), eq(forms.visibility, 'public')];

  if (opts.search) {
    conditions.push(
      or(
        like(forms.title, `%${opts.search}%`),
        like(forms.description, `%${opts.search}%`),
      )!,
    );
  }
  if (opts.theme) conditions.push(eq(forms.theme, opts.theme));
  if (opts.cursor) conditions.push(lt(forms.id, opts.cursor));

  const items = await db
    .select()
    .from(forms)
    .where(and(...conditions))
    .orderBy(desc(forms.createdAt))
    .limit(opts.limit + 1);

  const hasMore = items.length > opts.limit;
  const trimmed = hasMore ? items.slice(0, opts.limit) : items;
  const nextCursor = hasMore ? trimmed[trimmed.length - 1]!.id : null;

  return { items: trimmed, nextCursor };
}

/**
 * Deep-clones a form into a new draft owned by the same creator. Copies all
 * field configuration including conditional-logic rules — sourceFieldId UUIDs
 * are rewritten to point at the cloned field IDs so conditions stay valid.
 * Resets responseCount/viewCount/publishedAt and forces status='draft'.
 */
export async function cloneForm(formId: string, requesterId: string) {
  const original = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    with: { fields: { orderBy: (f, { asc: ascFn }) => [ascFn(f.order)] } },
  });
  if (!original) throw ApiError.notFound('Form not found');
  if (original.creatorId !== requesterId) {
    throw ApiError.forbidden('You do not have permission to clone this form');
  }

  const newSlug = await generateUniqueSlug(`${original.title}-copy`);

  // Pre-generate field UUIDs so conditional-logic rules can be remapped to
  // the cloned field IDs before the insert runs.
  const idMap = new Map<string, string>();
  for (const f of original.fields) idMap.set(f.id, randomUUID());

  return await db.transaction(async (tx) => {
    const [cloned] = await tx
      .insert(forms)
      .values({
        creatorId:       requesterId,
        title:           `${original.title} (Copy)`,
        description:     original.description,
        slug:            newSlug,
        status:          'draft',
        visibility:      original.visibility,
        theme:           original.theme,
        allowAnonymous:  original.allowAnonymous,
        requireEmail:    original.requireEmail,
        showProgressBar: original.showProgressBar,
        notifyCreator:   original.notifyCreator,
        thankYouTitle:   original.thankYouTitle,
        thankYouMessage: original.thankYouMessage,
        maxResponses:    original.maxResponses,
        expiresAt:       original.expiresAt,
        passwordHash:    original.passwordHash,
      })
      .returning();
    if (!cloned) throw ApiError.internal('Failed to clone form');

    if (original.fields.length > 0) {
      await tx.insert(fields).values(
        original.fields.map((f) => ({
          id:          idMap.get(f.id)!,
          formId:      cloned.id,
          type:        f.type,
          label:       f.label,
          placeholder: f.placeholder,
          description: f.description,
          required:    f.required,
          order:       f.order,
          config:      f.config,
          conditions:  remapConditionSourceIds(f.conditions, idMap),
        })),
      );
    }

    return cloned;
  });
}

/** Rewrites sourceFieldId references inside a field's conditions blob. */
function remapConditionSourceIds(conds: unknown, idMap: Map<string, string>): unknown {
  if (!conds || typeof conds !== 'object') return conds;
  const c = conds as { rules?: { sourceFieldId?: string }[] };
  if (!Array.isArray(c.rules)) return conds;
  return {
    ...c,
    rules: c.rules.map((r) => ({
      ...r,
      sourceFieldId: r.sourceFieldId ? (idMap.get(r.sourceFieldId) ?? r.sourceFieldId) : r.sourceFieldId,
    })),
  };
}

export async function incrementViewCount(formId: string): Promise<void> {
  await db
    .update(forms)
    .set({ viewCount: sql`${forms.viewCount} + 1` })
    .where(eq(forms.id, formId))
    .catch((err: unknown) => {
      logger.error({ err, formId }, '[VIEW] Failed to increment view count');
    });
}
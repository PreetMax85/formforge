import { randomUUID } from 'crypto';
import { db } from '../../common/db/index';
import { forms, fields, formDrafts } from '@repo/db/schema';
import { eq, desc, sql, and, lt, or, like, asc, isNull } from 'drizzle-orm';
import { ApiError, DraftContentSchema } from '@repo/shared';
import { getOrCreateDraft } from '../drafts/drafts.service';
import type { z } from 'zod';
import type { CreateFormSchema, UpdateFormSchema } from '@repo/shared';
import { logger } from '../../common/logger';

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

  return db.transaction(async (tx) => {
    const [form] = await tx
      .insert(forms)
      .values({ creatorId, title: input.title, description: input.description, slug, theme: input.theme ?? 'default' })
      .returning();
    if (!form) throw ApiError.internal('Failed to create form');
    await tx.insert(formDrafts).values({
      formId: form.id,
      content: {
        title: form.title, description: form.description, theme: input.theme ?? 'default',
        thankYouTitle: form.thankYouTitle, thankYouMessage: form.thankYouMessage, fields: [],
      },
    });
    return form;
  });
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
    .where(and(eq(fields.formId, id), isNull(fields.retiredAt)))
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
    .where(and(eq(fields.formId, form.id), isNull(fields.retiredAt)))
    .orderBy(asc(fields.order));

  return { ...form, fields: formFields };
}

/** Lists a creator's forms, named by their working (draft) title. */
export async function getFormsByCreator(creatorId: string) {
  const rows = await db
    .select({ form: forms, draftContent: formDrafts.content, revision: formDrafts.revision, publishedRevision: formDrafts.publishedRevision })
    .from(forms)
    .leftJoin(formDrafts, eq(formDrafts.formId, forms.id))
    .where(eq(forms.creatorId, creatorId))
    .orderBy(desc(forms.createdAt));

  return rows.map(({ form, draftContent, revision, publishedRevision }) => {
    const draftTitle = (draftContent as { title?: unknown } | null)?.title;
    return {
      ...form,
      draftTitle: typeof draftTitle === 'string' && draftTitle.trim() !== '' ? draftTitle : form.title,
      hasUnpublishedChanges: revision !== null && publishedRevision !== null && revision !== publishedRevision,
    };
  });
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
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      ...(input.notifyCreator !== undefined && { notifyCreator: input.notifyCreator }),
      ...(input.showProgressBar !== undefined && { showProgressBar: input.showProgressBar }),
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
  if (opts.cursor) {
    // Composite cursor: createdAt|id — ensures stable pagination with
    // ORDER BY createdAt DESC, id DESC (no skipped/duplicate rows)
    const sepIdx = opts.cursor.lastIndexOf('|');
    if (sepIdx > 0) {
      const cursorDate = opts.cursor.slice(0, sepIdx);
      const cursorId   = opts.cursor.slice(sepIdx + 1);
      const cursorCreatedAt = new Date(cursorDate);
      conditions.push(
        or(
          lt(forms.createdAt, cursorCreatedAt),
          and(eq(forms.createdAt, cursorCreatedAt), lt(forms.id, cursorId)),
        )!,
      );
    }
  }

  const items = await db
    .select()
    .from(forms)
    .where(and(...conditions))
    .orderBy(desc(forms.createdAt), desc(forms.id))
    .limit(opts.limit + 1);

  const hasMore = items.length > opts.limit;
  const trimmed = hasMore ? items.slice(0, opts.limit) : items;
  const last = trimmed[trimmed.length - 1];
  const nextCursor = hasMore && last ? `${last.createdAt.toISOString()}|${last.id}` : null;

  return { items: trimmed, nextCursor };
}

/**
 * Clones a form's working draft into a new, never-published form owned by the
 * same creator. The draft only ever holds live questions, so retired ones are
 * not copied. Questions get fresh ids and conditional-logic sourceFieldId
 * references are remapped to them. No `fields` rows are written: they appear
 * when the clone is first published. Resets counts and forces status='draft'.
 */
export async function cloneForm(formId: string, requesterId: string) {
  const [original] = await db.select().from(forms).where(eq(forms.id, formId)).limit(1);
  if (!original) throw ApiError.notFound('Form not found');
  if (original.creatorId !== requesterId) {
    throw ApiError.forbidden('You do not have permission to clone this form');
  }

  const source = await getOrCreateDraft(db, formId);
  const content = DraftContentSchema.parse(source.content);

  const newSlug = await generateUniqueSlug(`${original.title}-copy`);

  // Pre-generate question ids so conditional-logic rules can be remapped to
  // the cloned ids before the insert runs.
  const idMap = new Map<string, string>();
  for (const f of content.fields) idMap.set(f.id, randomUUID());

  return await db.transaction(async (tx) => {
    const [cloned] = await tx
      .insert(forms)
      .values({
        creatorId:       requesterId,
        title:           `${content.title || original.title} (Copy)`,
        description:     content.description,
        slug:            newSlug,
        status:          'draft',
        visibility:      original.visibility,
        theme:           content.theme,
        allowAnonymous:  original.allowAnonymous,
        requireEmail:    original.requireEmail,
        showProgressBar: original.showProgressBar,
        notifyCreator:   original.notifyCreator,
        thankYouTitle:   content.thankYouTitle,
        thankYouMessage: content.thankYouMessage,
        maxResponses:    original.maxResponses,
        expiresAt:       original.expiresAt,
        passwordHash:    original.passwordHash,
      })
      .returning();
    if (!cloned) throw ApiError.internal('Failed to clone form');

    await tx.insert(formDrafts).values({
      formId: cloned.id,
      content: {
        ...content,
        title: cloned.title,
        fields: content.fields.map((f) => ({
          ...f,
          id: idMap.get(f.id)!,
          conditions: f.conditions
            ? { ...f.conditions, rules: f.conditions.rules.map((r) => ({ ...r, sourceFieldId: idMap.get(r.sourceFieldId) ?? r.sourceFieldId })) }
            : null,
        })),
      },
    });

    return cloned;
  });
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
import { db } from '../../common/db/index.js';
import { forms, users } from '@repo/db/schema';
import { eq, desc, sql, and, gt, lt, or, like } from 'drizzle-orm';
import { ApiError } from '@repo/shared';
import type { z } from 'zod';
import type { CreateFormSchema, UpdateFormSchema } from '@repo/shared';

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
    const candidate = `${base}-${nanoid(4)}`;
    const collision = await db
      .select({ slug: forms.slug })
      .from(forms)
      .where(eq(forms.slug, candidate))
      .limit(1);
    if (collision.length === 0) return candidate;
  }

  return nanoid(12);
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

export async function getFormById(id: string) {
  const [form] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!form) throw ApiError.notFound('Form not found');
  return form;
}

export async function getFormBySlug(slug: string) {
  const [form] = await db.select().from(forms).where(eq(forms.slug, slug)).limit(1);
  if (!form) throw ApiError.notFound('Form not found');
  return form;
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
) {
  const [existing] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!existing) throw ApiError.notFound('Form not found');

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

  return updated;
}

export async function deleteForm(id: string) {
  const [existing] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!existing) throw ApiError.notFound('Form not found');
  await db.delete(forms).where(eq(forms.id, id));
}

export async function publishForm(id: string, visibility: 'public' | 'unlisted') {
  const [existing] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!existing) throw ApiError.notFound('Form not found');

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

  return updated;
}

export async function unpublishForm(id: string) {
  const [existing] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!existing) throw ApiError.notFound('Form not found');

  const [updated] = await db
    .update(forms)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(eq(forms.id, id))
    .returning();

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
  const nextCursor = hasMore ? trimmed[trimmed.length - 1].id : null;

  return { items: trimmed, nextCursor };
}

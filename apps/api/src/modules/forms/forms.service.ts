import { db } from '../../common/db/index.js';
import { forms } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '@repo/shared';

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

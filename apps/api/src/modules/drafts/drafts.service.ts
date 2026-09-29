import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../../common/db/index';
import { forms, fields, formDrafts } from '@repo/db/schema';
import {
  ApiError,
  ConditionalLogicSchema,
  DraftContentSchema,
  FORM_THEMES,
  type DraftContent,
} from '@repo/shared';

export type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface DraftView {
  content:           DraftContent;
  revision:          number;
  publishedRevision: number | null;
  updatedAt:         Date;
  slug:              string;
  status:            'draft' | 'published' | 'archived';
}

type Theme = typeof FORM_THEMES[number];
const isTheme = (t: string): t is Theme => (FORM_THEMES as readonly string[]).includes(t);

/**
 * Cleans conditional rules that DraftContentSchema would reject. Published
 * rows can hold rules that point at a question that no longer exists (or is
 * retired), or at the question itself; copying them into a draft would make
 * every save and load fail. Malformed conditions become null, rules with a
 * bad source are removed, and conditions left with no rules become null.
 * Fields without conditions are returned unchanged.
 */
export function dropBrokenRules(fieldList: DraftContent['fields']): DraftContent['fields'] {
  const questionIds = new Set(fieldList.map((f) => f.id));
  return fieldList.map((field) => {
    if (field.conditions === null) return field;
    if (!ConditionalLogicSchema.safeParse(field.conditions).success) {
      return { ...field, conditions: null };
    }
    const rules = field.conditions.rules.filter(
      (rule) => rule.sourceFieldId !== field.id && questionIds.has(rule.sourceFieldId),
    );
    if (rules.length === 0) return { ...field, conditions: null };
    return { ...field, conditions: { ...field.conditions, rules } };
  });
}

/** Builds draft content from what is live now: the form row plus its non-retired questions in order. */
export async function buildDraftContentFromPublished(conn: DbOrTx, formId: string): Promise<DraftContent> {
  const [form] = await conn.select().from(forms).where(eq(forms.id, formId)).limit(1);
  if (!form) throw ApiError.notFound('Form not found');
  const live = await conn
    .select()
    .from(fields)
    .where(and(eq(fields.formId, formId), isNull(fields.retiredAt)))
    .orderBy(asc(fields.order));

  const mapped = live.map((f) => {
    // Kept as unknown so dropBrokenRules parses it for real instead of trusting a cast.
    const rawConditions: unknown = f.conditions ?? null;
    return {
      id:          f.id,
      type:        f.type,
      label:       f.label,
      placeholder: f.placeholder,
      description: f.description,
      required:    f.required,
      config:      (f.config ?? {}) as Record<string, unknown>,
      conditions:  rawConditions as DraftContent['fields'][number]['conditions'],
    };
  });

  return {
    title:           form.title,
    description:     form.description,
    theme:           isTheme(form.theme) ? form.theme : 'default',
    thankYouTitle:   form.thankYouTitle,
    thankYouMessage: form.thankYouMessage,
    fields:          dropBrokenRules(mapped),
  };
}

/**
 * Returns the form's draft row, creating it from the published tables the
 * first time it is needed. Forms created before drafts existed get theirs
 * this way; concurrent first calls are safe thanks to ON CONFLICT DO NOTHING.
 */
export async function getOrCreateDraft(conn: DbOrTx, formId: string): Promise<typeof formDrafts.$inferSelect> {
  const [existing] = await conn.select().from(formDrafts).where(eq(formDrafts.formId, formId)).limit(1);
  if (existing) return existing;

  const [form] = await conn.select({ publishedAt: forms.publishedAt }).from(forms).where(eq(forms.id, formId)).limit(1);
  if (!form) throw ApiError.notFound('Form not found');
  const content = await buildDraftContentFromPublished(conn, formId);
  await conn
    .insert(formDrafts)
    .values({ formId, content, revision: 1, publishedRevision: form.publishedAt ? 1 : null })
    .onConflictDoNothing();

  const [created] = await conn.select().from(formDrafts).where(eq(formDrafts.formId, formId)).limit(1);
  if (!created) throw ApiError.internal('Failed to create draft');
  return created;
}

async function loadOwnedForm(formId: string, requesterId: string) {
  const [form] = await db
    .select({ creatorId: forms.creatorId, slug: forms.slug, status: forms.status })
    .from(forms)
    .where(eq(forms.id, formId))
    .limit(1);
  if (!form) throw ApiError.notFound('Form not found');
  if (form.creatorId !== requesterId) throw ApiError.forbidden('You do not have access to this form');
  return form;
}

function toView(
  row: typeof formDrafts.$inferSelect,
  form: { slug: string; status: DraftView['status'] },
): DraftView {
  return {
    content:           DraftContentSchema.parse(row.content),
    revision:          row.revision,
    publishedRevision: row.publishedRevision,
    updatedAt:         row.updatedAt,
    slug:              form.slug,
    status:            form.status,
  };
}

/** Loads the creator's draft for the builder. */
export async function getDraft(formId: string, requesterId: string): Promise<DraftView> {
  const form = await loadOwnedForm(formId, requesterId);
  const row = await getOrCreateDraft(db, formId);
  return toView(row, form);
}

/**
 * Autosave. Writes only if nobody saved since `baseRevision`; otherwise
 * throws 409 so the builder can tell the creator another tab changed it.
 */
export async function saveDraft(
  formId: string,
  baseRevision: number,
  content: DraftContent,
  requesterId: string,
): Promise<{ revision: number; updatedAt: Date }> {
  await loadOwnedForm(formId, requesterId);
  await getOrCreateDraft(db, formId);
  const valid = DraftContentSchema.parse(content);

  const [updated] = await db
    .update(formDrafts)
    .set({ content: valid, revision: baseRevision + 1, updatedAt: new Date() })
    .where(and(eq(formDrafts.formId, formId), eq(formDrafts.revision, baseRevision)))
    .returning({ revision: formDrafts.revision, updatedAt: formDrafts.updatedAt });

  if (!updated) throw ApiError.conflict('This form was changed in another tab. Reload to see the latest version.');
  return updated;
}

/** Throws away unpublished changes by rebuilding the draft from the live form. */
export async function discardDraft(formId: string, baseRevision: number, requesterId: string): Promise<DraftView> {
  const form = await loadOwnedForm(formId, requesterId);
  return db.transaction(async (tx) => {
    const row = await getOrCreateDraft(tx, formId);
    if (row.publishedRevision === null) throw ApiError.badRequest('This form has never been published.');
    const content = await buildDraftContentFromPublished(tx, formId);
    const next = baseRevision + 1;
    const [updated] = await tx
      .update(formDrafts)
      .set({ content, revision: next, publishedRevision: next, updatedAt: new Date() })
      .where(and(eq(formDrafts.formId, formId), eq(formDrafts.revision, baseRevision)))
      .returning();
    if (!updated) throw ApiError.conflict('This form was changed in another tab. Reload to see the latest version.');
    return toView(updated, form);
  });
}

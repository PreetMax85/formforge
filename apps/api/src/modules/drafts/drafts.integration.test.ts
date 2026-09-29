import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { DraftContent } from '@repo/shared';

const run = describe.skipIf(!process.env.TEST_DATABASE_URL);

run('drafts service (Neon branch)', async () => {
  const { db, closeDb } = await import('../../common/db/index');
  const { users, forms, fields, formDrafts, responses, responseAnswers } = await import('@repo/db/schema');
  const { getDraft, saveDraft, discardDraft, publishDraft } = await import('./drafts.service');
  const { createForm, cloneForm, getFormsByCreator } = await import('../forms/forms.service');

  const userId = randomUUID();
  const formId = randomUUID();
  const brokenRuleFormId = randomUUID();
  const oversizedFormId = randomUUID();

  beforeAll(async () => {
    await db.insert(users).values({ id: userId, email: `${userId}@test.local`, name: 'Test', passwordHash: 'x' });
    await db.insert(forms).values({ id: formId, creatorId: userId, title: 'T', slug: `t-${formId.slice(0, 8)}` });
    await db.insert(forms).values({ id: brokenRuleFormId, creatorId: userId, title: 'B', slug: `b-${brokenRuleFormId.slice(0, 8)}` });
    await db.insert(forms).values({ id: oversizedFormId, creatorId: userId, title: 'O', slug: `o-${oversizedFormId.slice(0, 8)}` });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, userId)); // cascades to forms, drafts, fields
    await closeDb();
  });

  it('creates a draft lazily from the form row', async () => {
    const draft = await getDraft(formId, userId);
    expect(draft.revision).toBe(1);
    expect(draft.publishedRevision).toBeNull();
    expect(draft.content.title).toBe('T');
    expect(draft.content.fields).toEqual([]);
  });

  it('saves with the current revision and rejects a stale one', async () => {
    const draft = await getDraft(formId, userId);
    const next: DraftContent = { ...draft.content, title: 'Renamed' };
    const saved = await saveDraft(formId, draft.revision, next, userId);
    expect(saved.revision).toBe(draft.revision + 1);
    await expect(saveDraft(formId, draft.revision, next, userId)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('refuses another user', async () => {
    await expect(getDraft(formId, randomUUID())).rejects.toMatchObject({ statusCode: 403 });
  });

  it('refuses to discard a never-published form', async () => {
    const draft = await getDraft(formId, userId);
    await expect(discardDraft(formId, draft.revision, userId)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('drops a live rule that points at a question that no longer exists', async () => {
    const fieldId = randomUUID();
    await db.insert(fields).values({
      id: fieldId,
      formId: brokenRuleFormId,
      type: 'short_text',
      label: 'Q1',
      order: 0,
      conditions: {
        action: 'show',
        match: 'all',
        rules: [{ sourceFieldId: randomUUID(), operator: 'equals', value: 'x' }],
      },
    });

    const draft = await getDraft(brokenRuleFormId, userId);
    expect(draft.content.fields).toHaveLength(1);
    expect(draft.content.fields[0]?.id).toBe(fieldId);
    expect(draft.content.fields[0]?.conditions).toBeNull();
  });

  it('refuses to build a draft from more questions than the builder supports and writes no row', async () => {
    await db.insert(fields).values(
      Array.from({ length: 51 }, (_, order) => ({
        formId: oversizedFormId,
        type: 'short_text' as const,
        label: `Q${order}`,
        order,
      })),
    );

    await expect(getDraft(oversizedFormId, userId)).rejects.toMatchObject({ statusCode: 400 });
    const rows = await db.select().from(formDrafts).where(eq(formDrafts.formId, oversizedFormId));
    expect(rows).toHaveLength(0);
  });

  const q = (n: number) => ({
    id: randomUUID(), type: 'short_text' as const, label: `Q${n}`, placeholder: null,
    description: null, required: false, config: {}, conditions: null,
  });

  it('refuses to publish zero questions', async () => {
    await expect(publishDraft(formId, 'unlisted', userId)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('publishes, swaps order, retires and un-retires without losing answers', async () => {
    const q1 = q(1), q2 = q(2);
    let d = await getDraft(formId, userId);
    await saveDraft(formId, d.revision, { ...d.content, fields: [q1, q2] }, userId);
    await publishDraft(formId, 'unlisted', userId);

    // An answer to q2 exists
    const [resp] = await db.insert(responses).values({ formId }).returning();
    await db.insert(responseAnswers).values({ responseId: resp!.id, fieldId: q2.id, value: 'hello' });

    // Swap order (would collide on the unique index without parking)
    d = await getDraft(formId, userId);
    await saveDraft(formId, d.revision, { ...d.content, fields: [q2, q1] }, userId);
    await publishDraft(formId, 'unlisted', userId);
    const swapped = await db.select().from(fields).where(eq(fields.formId, formId));
    expect(swapped.find((f) => f.id === q2.id)?.order).toBe(0);

    // Remove q2: retired, answer kept
    d = await getDraft(formId, userId);
    await saveDraft(formId, d.revision, { ...d.content, fields: [q1] }, userId);
    await publishDraft(formId, 'unlisted', userId);
    const [retired] = await db.select().from(fields).where(eq(fields.id, q2.id));
    expect(retired?.retiredAt).not.toBeNull();
    const answers = await db.select().from(responseAnswers).where(eq(responseAnswers.fieldId, q2.id));
    expect(answers).toHaveLength(1);

    // Bring q2 back: un-retired
    d = await getDraft(formId, userId);
    await saveDraft(formId, d.revision, { ...d.content, fields: [q1, q2] }, userId);
    await publishDraft(formId, 'unlisted', userId);
    const [back] = await db.select().from(fields).where(eq(fields.id, q2.id));
    expect(back?.retiredAt).toBeNull();

    // Revisions line up: nothing unpublished
    d = await getDraft(formId, userId);
    expect(d.publishedRevision).toBe(d.revision);
    expect(d.status).toBe('published');
  });

  it('discard restores the published content', async () => {
    let d = await getDraft(formId, userId);
    await saveDraft(formId, d.revision, { ...d.content, title: 'Unpublished title' }, userId);
    d = await getDraft(formId, userId);
    const discarded = await discardDraft(formId, d.revision, userId);
    expect(discarded.content.title).not.toBe('Unpublished title');
    expect(discarded.publishedRevision).toBe(discarded.revision);
  });

  it('refuses a question id that belongs to another form (foreign id)', async () => {
    const otherFormId = randomUUID();
    await db.insert(forms).values({ id: otherFormId, creatorId: userId, title: 'Other', slug: `o-${otherFormId.slice(0, 8)}` });
    const d = await getDraft(formId, userId);
    const [foreign] = await db.select().from(fields).where(eq(fields.formId, formId)).limit(1);
    const od = await getDraft(otherFormId, userId);
    await saveDraft(otherFormId, od.revision, { ...od.content, fields: [{ ...q(9), id: foreign!.id }] }, userId);
    await expect(publishDraft(otherFormId, 'unlisted', userId)).rejects.toMatchObject({ statusCode: 400 });
    expect(d.revision).toBeGreaterThan(0);
  });

  it('creates the draft row together with the form', async () => {
    const created = await createForm({ title: 'Fresh', theme: 'default' }, userId);
    const d = await getDraft(created.id, userId);
    expect(d.content.title).toBe('Fresh');
    expect(d.revision).toBe(1);
  });

  it('clones the draft with new question ids and remapped rules', async () => {
    const d = await getDraft(formId, userId);
    const cloned = await cloneForm(formId, userId);
    const cd = await getDraft(cloned.id, userId);
    expect(cd.content.fields).toHaveLength(d.content.fields.length);
    expect(cd.content.fields.map((f) => f.id)).not.toContain(d.content.fields[0]!.id);
    expect(cd.publishedRevision).toBeNull();
  });

  it('lists forms with the draft title and unpublished flag', async () => {
    const d = await getDraft(formId, userId);
    await saveDraft(formId, d.revision, { ...d.content, title: 'Working title' }, userId);
    const list = await getFormsByCreator(userId);
    const row = list.find((f) => f.id === formId);
    expect(row?.draftTitle).toBe('Working title');
    expect(row?.hasUnpublishedChanges).toBe(true);
  });
});

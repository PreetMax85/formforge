import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { DraftContent } from '@repo/shared';

const run = describe.skipIf(!process.env.TEST_DATABASE_URL);

run('drafts service (Neon branch)', async () => {
  const { db, closeDb } = await import('../../common/db/index');
  const { users, forms, fields } = await import('@repo/db/schema');
  const { getDraft, saveDraft, discardDraft } = await import('./drafts.service');

  const userId = randomUUID();
  const formId = randomUUID();
  const brokenRuleFormId = randomUUID();

  beforeAll(async () => {
    await db.insert(users).values({ id: userId, email: `${userId}@test.local`, name: 'Test', passwordHash: 'x' });
    await db.insert(forms).values({ id: formId, creatorId: userId, title: 'T', slug: `t-${formId.slice(0, 8)}` });
    await db.insert(forms).values({ id: brokenRuleFormId, creatorId: userId, title: 'B', slug: `b-${brokenRuleFormId.slice(0, 8)}` });
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
});

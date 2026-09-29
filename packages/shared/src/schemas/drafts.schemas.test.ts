import { describe, it, expect } from 'vitest';
import { DraftContentSchema, findPublishProblems, type DraftContent } from './drafts.schemas';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';

function content(overrides: Partial<DraftContent> = {}): DraftContent {
  return {
    title: 'Survey',
    description: null,
    theme: 'default',
    thankYouTitle: 'Thank you!',
    thankYouMessage: 'Recorded.',
    fields: [
      { id: A, type: 'short_text', label: 'Name', placeholder: null, description: null, required: true, config: {}, conditions: null },
      { id: B, type: 'single_select', label: 'Pick', placeholder: null, description: null, required: false, config: { options: ['x', 'y'] }, conditions: null },
    ],
    ...overrides,
  };
}

describe('DraftContentSchema', () => {
  it('accepts valid content', () => {
    expect(DraftContentSchema.safeParse(content()).success).toBe(true);
  });

  it('accepts an empty title and label while the creator is typing', () => {
    const c = content({ title: '' });
    c.fields[0]!.label = '';
    expect(DraftContentSchema.safeParse(c).success).toBe(true);
  });

  it('rejects duplicate question ids', () => {
    const c = content();
    c.fields[1]!.id = A;
    expect(DraftContentSchema.safeParse(c).success).toBe(false);
  });

  it('rejects a rule that points at a question not in the draft', () => {
    const c = content();
    c.fields[1]!.conditions = { action: 'show', match: 'all', rules: [{ sourceFieldId: C, operator: 'equals', value: 'x' }] };
    expect(DraftContentSchema.safeParse(c).success).toBe(false);
  });

  it('rejects a rule that points at its own question', () => {
    const c = content();
    c.fields[1]!.conditions = { action: 'show', match: 'all', rules: [{ sourceFieldId: B, operator: 'equals', value: 'x' }] };
    expect(DraftContentSchema.safeParse(c).success).toBe(false);
  });

  it('rejects an unknown field type', () => {
    const c = content() as unknown as { fields: { type: string }[] };
    c.fields[0]!.type = 'signature';
    expect(DraftContentSchema.safeParse(c).success).toBe(false);
  });

  it('rejects more than 50 questions', () => {
    const many = Array.from({ length: 51 }, (_, i) => ({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      type: 'short_text' as const, label: `Q${i}`, placeholder: null, description: null,
      required: false, config: {}, conditions: null,
    }));
    expect(DraftContentSchema.safeParse(content({ fields: many })).success).toBe(false);
  });
});

describe('findPublishProblems', () => {
  it('returns nothing for a publishable form', () => {
    expect(findPublishProblems(content())).toEqual([]);
  });

  it('requires a title', () => {
    expect(findPublishProblems(content({ title: '  ' }))).toContain('Give the form a title.');
  });

  it('requires at least one question', () => {
    expect(findPublishProblems(content({ fields: [] }))).toContain('Add at least one question.');
  });

  it('requires every question to have a label', () => {
    const c = content();
    c.fields[0]!.label = '';
    expect(findPublishProblems(c)).toContain('Question 1 needs a label.');
  });

  it('requires choice questions to have a non-empty option', () => {
    const c = content();
    c.fields[1]!.config = { options: ['', ' '] };
    expect(findPublishProblems(c)).toContain('Question 2 needs at least one option.');
  });
});

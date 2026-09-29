import { describe, it, expect } from 'vitest';
import type { DraftField } from '@repo/shared';
import { dropBrokenRules } from './drafts.service';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

type Conditions = DraftField['conditions'];

const rule = (sourceN: number) => ({ sourceFieldId: id(sourceN), operator: 'equals' as const, value: 'x' });
const logic = (...sources: number[]): Conditions => ({ action: 'show', match: 'all', rules: sources.map(rule) });

const field = (n: number, conditions: Conditions = null): DraftField => ({
  id: id(n), type: 'short_text', label: `Q${n}`, placeholder: null,
  description: null, required: false, config: {}, conditions,
});

describe('dropBrokenRules', () => {
  it('drops a rule that points at a question that is not in the list', () => {
    const [result] = dropBrokenRules([field(1, logic(98)), field(2)]);
    expect(result?.conditions).toBeNull();
  });

  it('drops a rule that points at the question itself', () => {
    const result = dropBrokenRules([field(1, logic(1)), field(2)]);
    expect(result[0]?.conditions).toBeNull();
  });

  it('keeps a valid rule next to a dropped one', () => {
    const result = dropBrokenRules([field(1), field(2, logic(1, 99, 2))]);
    expect(result[1]?.conditions).toEqual(logic(1));
  });

  it('sets conditions to null when no rules remain', () => {
    const result = dropBrokenRules([field(1), field(2, logic(99, 98))]);
    expect(result[1]?.conditions).toBeNull();
  });

  it('sets malformed conditions to null', () => {
    const malformed = { action: 'explode', rules: 'nope' } as unknown as Conditions;
    const result = dropBrokenRules([field(1), field(2, malformed)]);
    expect(result[1]?.conditions).toBeNull();
  });

  it('returns a field without conditions unchanged', () => {
    const plain = field(1);
    const result = dropBrokenRules([plain]);
    expect(result[0]).toBe(plain);
  });
});

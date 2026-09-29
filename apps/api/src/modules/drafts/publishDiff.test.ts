import { describe, it, expect } from 'vitest';
import type { DraftField } from '@repo/shared';
import { diffDraftAgainstPublished } from './publishDiff';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const draft = (n: number): DraftField => ({
  id: id(n), type: 'short_text', label: `Q${n}`, placeholder: null,
  description: null, required: false, config: {}, conditions: null,
});

describe('diffDraftAgainstPublished', () => {
  it('inserts questions that were never published', () => {
    const diff = diffDraftAgainstPublished([draft(1)], []);
    expect(diff.insert).toEqual([{ field: draft(1), order: 0 }]);
    expect(diff.update).toEqual([]);
    expect(diff.retire).toEqual([]);
  });

  it('updates live questions and takes order from array position', () => {
    const diff = diffDraftAgainstPublished(
      [draft(2), draft(1)],
      [{ id: id(1), retired: false }, { id: id(2), retired: false }],
    );
    expect(diff.update).toEqual([{ field: draft(2), order: 0 }, { field: draft(1), order: 1 }]);
    expect(diff.insert).toEqual([]);
  });

  it('retires live questions missing from the draft', () => {
    const diff = diffDraftAgainstPublished([draft(1)], [{ id: id(1), retired: false }, { id: id(2), retired: false }]);
    expect(diff.retire).toEqual([id(2)]);
  });

  it('does not retire a question twice', () => {
    const diff = diffDraftAgainstPublished([draft(1)], [{ id: id(1), retired: false }, { id: id(2), retired: true }]);
    expect(diff.retire).toEqual([]);
  });

  it('un-retires a retired question that comes back', () => {
    const diff = diffDraftAgainstPublished([draft(2)], [{ id: id(2), retired: true }]);
    expect(diff.unretire).toEqual([{ field: draft(2), order: 0 }]);
    expect(diff.update).toEqual([]);
    expect(diff.insert).toEqual([]);
  });
});

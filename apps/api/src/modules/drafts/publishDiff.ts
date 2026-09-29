import type { DraftField } from '@repo/shared';

export interface PublishedFieldState { id: string; retired: boolean }
export interface OrderedDraftField { field: DraftField; order: number }
export interface PublishDiff {
  insert:   OrderedDraftField[];
  update:   OrderedDraftField[];
  unretire: OrderedDraftField[];
  retire:   string[];
}

/**
 * Works out what publishing a draft does to the live `fields` rows:
 * new questions are inserted, live ones updated, retired ones that came back
 * are un-retired, and live ones missing from the draft are retired (never
 * deleted, so their answers survive). Order is the question's array index.
 */
export function diffDraftAgainstPublished(
  draftFields: DraftField[],
  published: PublishedFieldState[],
): PublishDiff {
  const publishedById = new Map(published.map((p) => [p.id, p]));
  const draftIds = new Set(draftFields.map((f) => f.id));
  const diff: PublishDiff = { insert: [], update: [], unretire: [], retire: [] };

  draftFields.forEach((field, order) => {
    const existing = publishedById.get(field.id);
    if (!existing) diff.insert.push({ field, order });
    else if (existing.retired) diff.unretire.push({ field, order });
    else diff.update.push({ field, order });
  });

  for (const p of published) {
    if (!p.retired && !draftIds.has(p.id)) diff.retire.push(p.id);
  }
  return diff;
}

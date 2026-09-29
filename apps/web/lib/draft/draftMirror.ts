import { DraftContentSchema, type DraftContent } from '@repo/shared';

/** Unsaved edits kept in this tab, with the server revision they were made on top of. */
export interface DraftMirror { baseRevision: number; content: DraftContent }

const key = (formId: string): string => `formforge:draft:${formId}`;

/** Keeps unsaved edits in this tab so a reload does not lose them. */
export function writeMirror(formId: string, mirror: DraftMirror): void {
  try {
    sessionStorage.setItem(key(formId), JSON.stringify(mirror));
  } catch {
    // Storage full or blocked (private window): the mirror is best effort.
  }
}

/**
 * Returns unsaved edits only if they were made on top of the revision the
 * server still has; anything older is stale and is removed.
 */
export function readMirror(formId: string, serverRevision: number): DraftMirror | null {
  try {
    const raw = sessionStorage.getItem(key(formId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { baseRevision?: unknown; content?: unknown };
    const content = DraftContentSchema.safeParse(parsed.content);
    if (parsed.baseRevision !== serverRevision || !content.success) {
      sessionStorage.removeItem(key(formId));
      return null;
    }
    return { baseRevision: serverRevision, content: content.data };
  } catch {
    return null;
  }
}

/** Forgets unsaved edits once they are saved. */
export function clearMirror(formId: string): void {
  try {
    sessionStorage.removeItem(key(formId));
  } catch {
    // Storage blocked: nothing to clear.
  }
}

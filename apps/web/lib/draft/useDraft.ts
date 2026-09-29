'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DraftContent } from '@repo/shared';
import { trpc } from '~/trpc/client';
import { DraftSaveController, type SaveStatus } from './saveController';
import { saveDraftRequest } from './saveDraftRequest';
import { clearMirror, readMirror, writeMirror, type DraftMirror } from './draftMirror';

export interface UseDraft {
  isLoading: boolean;
  error: string | null;
  content: DraftContent | null;
  status: SaveStatus;
  statusMessage: string | null;
  savedAt: Date | null;
  slug: string | null;
  formStatus: 'draft' | 'published' | 'archived' | null;
  hasBeenPublished: boolean;
  hasUnpublishedChanges: boolean;
  restorable: DraftMirror | null;
  update(recipe: (draft: DraftContent) => DraftContent): void;
  flushNow(): Promise<SaveStatus>;
  restore(): void;
  dismissRestore(): void;
  publish(visibility: 'public' | 'unlisted'): Promise<boolean>;
  isPublishing: boolean;
  discard(): Promise<void>;
  reload(): void;
}

/**
 * Saves still finishing for a page that unmounted (builder to settings, say),
 * keyed by form id. The next useDraft for that form waits for them before it
 * loads, or it would load the revision before that save and then conflict
 * with it.
 */
const settling = new Map<string, Promise<void>>();

const SETTLE_TIMEOUT_MS = 10_000;

/** Statuses in which edits exist that the server does not have yet. */
const UNSAVED_STATUSES: ReadonlySet<SaveStatus> = new Set(['unsaved', 'saving', 'offline', 'error']);

/**
 * Loads a form's draft and keeps it saved: every `update` goes into local
 * state at once and is autosaved by DraftSaveController. Used by the builder
 * and the settings page.
 */
export function useDraft(formId: string): UseDraft {
  const [ready, setReady] = useState(() => !settling.has(formId));
  // gcTime 0: the next page to use this draft fetches it fresh instead of
  // starting from the copy this page loaded (staleTime is Infinity app-wide).
  const query = trpc.drafts.get.useQuery({ formId }, { enabled: ready, gcTime: 0 });
  const discardMutation = trpc.drafts.discard.useMutation();
  const publishMutation = trpc.forms.publish.useMutation();

  const [content, setContent] = useState<DraftContent | null>(null);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [revision, setRevision] = useState(0);
  const [publishedRevision, setPublishedRevision] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<UseDraft['formStatus']>(null);
  const [restorable, setRestorable] = useState<DraftMirror | null>(null);
  const controllerRef = useRef<DraftSaveController<DraftContent> | null>(null);
  const contentRef = useRef<DraftContent | null>(null);

  const data = query.data?.data;
  const dataUpdatedAt = query.dataUpdatedAt;

  // Wait for a save left over from a page that just unmounted.
  useEffect(() => {
    if (ready) return;
    let live = true;
    const pending = settling.get(formId);
    if (!pending) {
      setReady(true);
      return;
    }
    // A hung request must not keep this page loading forever: after
    // SETTLE_TIMEOUT_MS load anyway (at worst the first save conflicts).
    const timer = setTimeout(() => { if (live) setReady(true); }, SETTLE_TIMEOUT_MS);
    void pending.then(() => { if (live) setReady(true); });
    return () => { live = false; clearTimeout(timer); };
  }, [formId, ready]);

  // (Re)start from the server copy whenever a fresh one arrives. Keyed on
  // dataUpdatedAt too, so reload() restarts even if the data is unchanged.
  useEffect(() => {
    if (!data) return;
    controllerRef.current?.dispose();
    let seenRevision = data.revision;
    const controller: DraftSaveController<DraftContent> = new DraftSaveController<DraftContent>({
      initialRevision: data.revision,
      save: (c, base) => saveDraftRequest(formId, c, base),
      onChange: (s) => {
        setStatus(s.status);
        setStatusMessage(s.message);
        setRevision(s.revision);
        if (s.status === 'saved') {
          setSavedAt(new Date());
          clearMirror(formId);
        } else if (s.revision !== seenRevision && controller.hasPendingChanges() && contentRef.current) {
          // A save of older content moved the revision on while newer edits
          // were still pending: re-base the mirror, or a reload now would
          // throw those edits away as stale.
          writeMirror(formId, { baseRevision: s.revision, content: contentRef.current });
        }
        seenRevision = s.revision;
      },
    });
    controllerRef.current = controller;
    contentRef.current = data.content;
    setContent(data.content);
    setRevision(data.revision);
    setPublishedRevision(data.publishedRevision);
    setFormStatus(data.status);
    setSavedAt(new Date(data.updatedAt));
    setStatus('saved');
    setStatusMessage(null);
    setRestorable(readMirror(formId, data.revision));
  }, [data, dataUpdatedAt, formId]);

  // Unmount: send what is pending, then stop. Not done on reload, where the
  // pending edits belong to a draft the fresh copy replaces.
  useEffect(() => () => {
    const controller = controllerRef.current;
    if (!controller) return;
    controllerRef.current = null;
    if (!controller.hasPendingChanges()) {
      controller.dispose();
      return;
    }
    const done = controller.flush().then(() => controller.dispose());
    settling.set(formId, done);
    void done.finally(() => { if (settling.get(formId) === done) settling.delete(formId); });
  }, [formId]);

  const update = useCallback((recipe: (draft: DraftContent) => DraftContent) => {
    const current = contentRef.current;
    const controller = controllerRef.current;
    if (!current || !controller) return;
    const next = recipe(current);
    contentRef.current = next;
    setContent(next);
    controller.edit(next);
    writeMirror(formId, { baseRevision: controller.getRevision(), content: next });
  }, [formId]);

  // Tab hidden (switching away, closing, or the phone locking): save now;
  // the request uses keepalive so it survives the page going away.
  useEffect(() => {
    const onHide = (): void => {
      if (document.visibilityState === 'hidden') void controllerRef.current?.flush();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // Leaving with unsaved work: start the save and show the browser's
  // "Leave site?" prompt. Only attached while needed (it disables bfcache).
  const needsWarning = UNSAVED_STATUSES.has(status);
  useEffect(() => {
    if (!needsWarning) return;
    const warn = (e: BeforeUnloadEvent): void => {
      void controllerRef.current?.flush();
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [needsWarning]);

  const flushNow = useCallback(
    (): Promise<SaveStatus> => controllerRef.current?.flush() ?? Promise.resolve<SaveStatus>('saved'),
    [],
  );

  const restore = useCallback(() => {
    if (!restorable) return;
    const mirror = restorable;
    setRestorable(null);
    update(() => mirror.content);
  }, [restorable, update]);

  const dismissRestore = useCallback(() => {
    setRestorable(null);
    clearMirror(formId);
  }, [formId]);

  const [isPublishing, setIsPublishing] = useState(false);
  const { mutateAsync: publishAsync } = publishMutation;
  const publish = useCallback(async (visibility: 'public' | 'unlisted'): Promise<boolean> => {
    const controller = controllerRef.current;
    if (!controller) return false;
    setIsPublishing(true);
    try {
      const flushed = await controller.flush();
      // Replaced by a reload meanwhile, or not saved (offline, error, conflict): do not publish.
      if (flushed !== 'saved' || controllerRef.current !== controller) return false;
      // The revision known to be saved before the request. An autosave landing
      // meanwhile may also get published; then we only over-report changes.
      const publishing = controller.getRevision();
      await publishAsync({ id: formId, visibility });
      setPublishedRevision(publishing);
      setFormStatus('published');
      return true;
    } finally {
      setIsPublishing(false);
    }
  }, [formId, publishAsync]);

  const { mutateAsync: discardAsync } = discardMutation;
  const discard = useCallback(async (): Promise<void> => {
    const controller = controllerRef.current;
    if (!controller) return;
    // Let an in-flight save finish first, so the discard is based on the
    // revision the server actually has.
    await controller.flush();
    if (controllerRef.current !== controller) return;
    const res = await discardAsync({ formId, baseRevision: controller.getRevision() });
    if (controllerRef.current !== controller) return;
    controller.reset(res.data.revision);
    contentRef.current = res.data.content;
    setContent(res.data.content);
    setPublishedRevision(res.data.publishedRevision);
    setFormStatus(res.data.status);
    setSavedAt(new Date(res.data.updatedAt));
    setRestorable(null);
    clearMirror(formId);
  }, [discardAsync, formId]);

  const { refetch } = query;
  const reload = useCallback(() => { void refetch(); }, [refetch]);

  return {
    isLoading: !ready || query.isLoading,
    error: query.error?.message ?? null,
    content,
    status,
    statusMessage,
    savedAt,
    slug: data?.slug ?? null,
    formStatus,
    hasBeenPublished: publishedRevision !== null,
    hasUnpublishedChanges: publishedRevision !== null && (revision !== publishedRevision || status !== 'saved'),
    restorable,
    update,
    flushNow,
    restore,
    dismissRestore,
    publish,
    isPublishing,
    discard,
    reload,
  };
}

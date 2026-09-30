'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  type CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { findPublishProblems, MAX_DRAFT_FIELDS, type DraftField } from '@repo/shared';

import { trpc } from '~/trpc/client';
import { GameEngineShell } from '~/components/engine/GameEngineShell';
import { Menubar } from '~/components/engine/Menubar';
import { HierarchyPanel } from '~/components/engine/HierarchyPanel';
import { SceneView } from '~/components/engine/SceneView';
import { InspectorPanel } from '~/components/engine/InspectorPanel';
import { ConsolePanel, type ConsoleMessage } from '~/components/engine/ConsolePanel';
import { FieldPalette } from '~/components/builder/FieldPalette';
import { BuilderCanvas, DROPPABLE_ID } from '~/components/builder/BuilderCanvas';
import { PublishModal } from '~/components/builder/PublishModal';
import DraftStatusBar from '~/components/builder/DraftStatusBar';
import { FormRenderer } from '~/components/form/FormRenderer';
import LoadingScreen from '~/components/shared/LoadingScreen';
import { useDelayedLoading } from '~/lib/hooks/useDelayedLoading';
import { useDraft } from '~/lib/draft/useDraft';

import type { Field, FieldType } from '~/lib/types/field';

/** The builder's components take the older `Field` shape; this maps a draft question to it. */
function toBuilderField(f: DraftField, index: number, formId: string): Field {
  return {
    id: f.id, formId, type: f.type, label: f.label, placeholder: f.placeholder,
    description: f.description, required: f.required, order: index,
    config: f.config as Field['config'], conditions: f.conditions,
    createdAt: '', updatedAt: '',
  };
}

/** Maps a builder `Field` back to the draft question it is saved as. */
function toDraftField(f: Field): DraftField {
  return {
    id: f.id, type: f.type, label: f.label, placeholder: f.placeholder ?? null,
    description: f.description ?? null, required: f.required,
    config: f.config as Record<string, unknown>, conditions: f.conditions ?? null,
  };
}

/** True when a request failed because another tab changed the draft (HTTP 409). */
function isConflictError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('data' in err)) return false;
  const data = (err as { data?: { httpStatus?: number; code?: string } | null }).data;
  return data?.httpStatus === 409 || data?.code === 'CONFLICT';
}

/** Default config per field type */
function defaultConfig(type: FieldType): Record<string, unknown> {
  if (type === 'rating') return { max: 5 };
  if (
    type === 'single_select' ||
    type === 'multi_select' ||
    type === 'dropdown'
  )
    return { options: ['Option 1', 'Option 2'] };
  return {};
}

/** Default label per field type */
function defaultLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    short_text: 'Short Answer',
    long_text: 'Paragraph',
    email: 'Email Address',
    number: 'Number',
    single_select: 'Single Choice',
    multi_select: 'Multiple Choice',
    checkbox: 'Checkbox',
    rating: 'Rating',
    date: 'Date',
    dropdown: 'Dropdown',
  };
  return labels[type];
}

/* ── Loading / Error / Empty state components ─────────────────────── */
function FullscreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 w-full h-screen"
      style={{ background: '#1e1e1e', color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}
    >
      {children}
    </div>
  );
}

const messageActionStyle: React.CSSProperties = {
  padding: '6px 16px',
  background: '#252526',
  border: '1px solid #3c3c3c',
  color: '#d4d4d4',
  fontSize: '12px',
  fontFamily: "'JetBrains Mono', monospace",
  cursor: 'pointer',
};

/** Ways out of an error screen: try the request again, or leave. */
function MessageActions({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex gap-2">
      {onRetry && (
        <button type="button" onClick={onRetry} style={messageActionStyle}>
          Retry
        </button>
      )}
      <Link href="/dashboard" style={messageActionStyle}>
        Back to forms
      </Link>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function BuilderPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  /* ── Server state ────────────────────────────────────────────── */
  // The draft (useDraft) holds everything the creator edits. The form query
  // only supplies the operational settings the preview needs.
  const utils = trpc.useUtils();
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = trpc.forms.byId.useQuery({ id: formId });
  const draft = useDraft(formId);

  const form = response?.data;

  /* Every edit goes through the draft; the builder's components see it as `fields`. */
  const fields = useMemo(
    () => (draft.content?.fields ?? []).map((f, i) => toBuilderField(f, i, formId)),
    [draft.content, formId],
  );
  const { update: updateDraft } = draft; // stable across renders
  const setFields = useCallback(
    (recipe: (prev: Field[]) => Field[]) =>
      updateDraft((c) => ({
        ...c,
        fields: recipe(c.fields.map((f, i) => toBuilderField(f, i, formId))).map(toDraftField),
      })),
    [updateDraft, formId],
  );

  /* ── Local UI state ──────────────────────────────────────────── */
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const consoleRef = useRef<ConsoleMessage[]>([]);

  const MAX_CONSOLE_LINES = 200;

  function pushLog(type: ConsoleMessage['type'], text: string) {
    consoleRef.current = [...consoleRef.current.slice(-(MAX_CONSOLE_LINES - 1)), { type, text }];
    setConsoleMessages(consoleRef.current);
  }

  /* Log the scene once, when the draft first loads */
  const hasDraft = draft.content !== null;
  useEffect(() => {
    if (!draft.content) return;
    const count = draft.content.fields.length;
    consoleRef.current = [];
    pushLog(
      'success',
      `Scene loaded: "${draft.content.title}" (${count} fields${count === 0 ? ', empty scene' : ''})`
    );
  }, [hasDraft, formId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Offer to restore edits a closed tab never got to save */
  useEffect(() => {
    if (!draft.restorable) return;
    toast('Restore changes that were not saved?', {
      description: 'They were kept in this tab when the page closed.',
      action: { label: 'Restore', onClick: draft.restore },
      cancel: { label: 'Discard', onClick: draft.dismissRestore },
      duration: Infinity,
    });
  }, [draft.restorable]); // eslint-disable-line react-hooks/exhaustive-deps

  /* A failed reload must not replace a working editor: report it in a toast */
  const reloadError = draft.content !== null ? draft.error : null;
  useEffect(() => {
    if (reloadError) toast.error(`Couldn't reload the latest version: ${reloadError}`);
  }, [reloadError]);

  /* ── DnD sensors ─────────────────────────────────────────────── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  /* ── Add field ───────────────────────────────────────────────── */
  // Clicking a palette row and dropping it on the canvas both land here, and
  // both append: the drop position is not used.
  // A draft holds at most MAX_DRAFT_FIELDS questions; one more would make
  // every later autosave fail, so stop here and say why.
  const fieldCount = fields.length;
  const addField = useCallback(
    (type: FieldType) => {
      if (fieldCount >= MAX_DRAFT_FIELDS) {
        toast.error(`This form has the maximum of ${MAX_DRAFT_FIELDS} questions.`);
        return;
      }
      const label = defaultLabel(type);
      const newField: Field = {
        id: crypto.randomUUID(),
        formId,
        type,
        label,
        placeholder: null,
        description: null,
        required: false,
        order: 0,
        config: defaultConfig(type),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Checked again against the draft itself: two adds can land in one render.
      setFields((prev) =>
        prev.length >= MAX_DRAFT_FIELDS ? prev : [...prev, { ...newField, order: prev.length }]);
      setActiveFieldId(newField.id);
      pushLog('info', `Asset "${label}" added to scene`);
    },
    [formId, setFields, fieldCount]
  );

  /* ── DnD handlers ────────────────────────────────────────────── */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // New field dropped from palette onto canvas
      if (activeId.startsWith('palette-') && overId === DROPPABLE_ID) {
        addField(active.data.current?.type as FieldType);
        return;
      }

      // Reorder existing fields
      if (activeId !== overId && !activeId.startsWith('palette-')) {
        setFields((prev) => {
          const oldIndex = prev.findIndex((f) => f.id === activeId);
          const newIndex = prev.findIndex((f) => f.id === overId);
          if (oldIndex === -1 || newIndex === -1) return prev;
          return arrayMove(prev, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }));
        });
      }
    },
    [addField, setFields]
  );

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Intentionally empty — drop visual handled by useDroppable isOver
  }, []);

  /* ── Field update ────────────────────────────────────────────── */
  const handleFieldUpdate = useCallback((updated: Partial<Field>) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === activeFieldId ? { ...f, ...updated } : f
      )
    );
  }, [activeFieldId, setFields]);

  /* ── Delete field ────────────────────────────────────────────── */
  function handleDeleteField(field: Field) {
    const label = field.label || 'this field';

    toast(`Delete "${label}"?`, {
      description: 'It will leave the live form when you publish. Its answers are kept.',
      action: {
        label: 'Delete',
        onClick: () => {
          setFields((prev) => prev.filter((f) => f.id !== field.id));
          if (activeFieldId === field.id) setActiveFieldId(null);
          pushLog('info', `Removed "${label}" from scene`);
        },
      },
    });
  }

  /* ── Discard ─────────────────────────────────────────────────── */
  function handleDiscard() {
    draft.discard().then(
      () => {
        setActiveFieldId(null);
        pushLog('info', 'Scene reset to the last published version');
        toast.success('Changes discarded.');
      },
      (err: unknown) => {
        if (isConflictError(err)) {
          // Another tab saved in between: what is on screen is out of date.
          toast.error('This form was changed in another tab. Loading the latest version.');
          draft.reload();
          return;
        }
        toast.error(err instanceof Error ? err.message : 'Discard failed.');
      },
    );
  }

  /* ── Play (preview) ──────────────────────────────────────────── */
  // The preview renders from the draft, so there is nothing to save first.
  function handlePlay() {
    setPreviewOpen(true);
  }

  /* ── Publish ─────────────────────────────────────────────────── */
  function handlePublish() {
    const problems = draft.content ? findPublishProblems(draft.content) : [];
    if (problems.length > 0) {
      toast.error(problems[0]);
      return;
    }
    setPublishModalOpen(true);
  }

  async function handlePublishConfirm(visibility: 'public' | 'unlisted') {
    try {
      const ok = await draft.publish(visibility);
      if (!ok) {
        toast.error("Couldn't save your latest changes, so nothing was published.");
        return;
      }
      pushLog('success', 'Published');
      toast.success('Published.');
      setPublishModalOpen(false);
      void utils.forms.byId.invalidate({ id: formId });
    } catch (err) {
      pushLog('error', `Publish failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      toast.error(err instanceof Error ? err.message : 'Publish failed.');
    }
  }

  /* ── Active field ────────────────────────────────────────────── */
  const activeField = fields.find((f) => f.id === activeFieldId) ?? null;

  /* ── 4-state async pattern ───────────────────────────────────── */
  // Loading is checked first: checking !form first showed "not found" for
  // the whole delay window before the loading screen appears. A draft that
  // is not there yet, without an error, is still loading, not missing.
  const loading = isLoading || draft.isLoading || (draft.content === null && !draft.error);
  const showLoading = useDelayedLoading(loading);
  if (loading) {
    if (!showLoading) return null;
    return <LoadingScreen variant="fullscreen" />;
  }

  // Once a draft is showing, a failed reload is reported in a toast instead.
  const loadError = (draft.content === null ? draft.error : null) ?? error?.message ?? null;
  if (loadError) {
    return (
      <FullscreenMessage>
        <span style={{ color: '#ef4444' }}>
          [ERROR] {loadError}
        </span>
        <MessageActions
          onRetry={() => {
            void refetch();
            draft.reload();
          }}
        />
      </FullscreenMessage>
    );
  }

  if (!form || !draft.content) {
    return (
      <FullscreenMessage>
        Form not found.
        <MessageActions />
      </FullscreenMessage>
    );
  }

  /* ── Preview mode ───────────────────────────────────────────── */
  if (previewOpen) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <button
          onClick={() => setPreviewOpen(false)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 50,
            padding: '8px 16px',
            background: '#252526',
            border: '1px solid #3c3c3c',
            color: '#d4d4d4',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            cursor: 'pointer',
            letterSpacing: '0.06em',
          }}
        >
          ← BACK TO BUILDER
        </button>
        <FormRenderer
          formConfig={{
            id: form.id,
            slug: form.slug,
            title: draft.content.title,
            description: draft.content.description,
            theme: draft.content.theme,
            showProgressBar: form.showProgressBar,
            requireEmail: form.requireEmail,
            allowAnonymous: form.allowAnonymous,
            thankYouTitle: draft.content.thankYouTitle,
            thankYouMessage: draft.content.thankYouMessage,
            fields,
          }}
          mode="preview"
        />
      </div>
    );
  }

  /* ── Builder render ─────────────────────────────────────────── */
  const collisionDetection: CollisionDetection = (args) => {
    if (args.active.data.current?.fromPalette) {
      const collisions = pointerWithin(args);
      const canvasCollision = collisions?.find((c) => c.id === DROPPABLE_ID);
      if (canvasCollision) return [canvasCollision];
      return collisions ?? [];
    }
    return closestCenter(args);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <GameEngineShell
          menubar={
            <Menubar
              formTitle={draft.content.title}
              formId={formId}
              onPlay={handlePlay}
              onPublish={handlePublish}
              isPublishing={draft.isPublishing}
              // Leaving saves pending edits, so warn only when that save cannot succeed.
              hasUnsavedChanges={draft.status === 'offline' || draft.status === 'error' || draft.status === 'conflict'}
              publishLabel={draft.hasUnpublishedChanges ? 'PUBLISH CHANGES' : 'PUBLISH'}
            />
          }
          hierarchy={
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0">
                <HierarchyPanel
                  fields={fields}
                  activeFieldId={activeFieldId}
                  onSelect={setActiveFieldId}
                />
              </div>
              <FieldPalette onAdd={addField} />
            </div>
          }
          scene={
            <SceneView>
              <BuilderCanvas
                fields={fields}
                onSelect={setActiveFieldId}
                activeFieldId={activeFieldId}
              />
            </SceneView>
          }
          inspector={
            <InspectorPanel
              field={activeField}
              allFields={fields}
              onUpdate={handleFieldUpdate}
              onDelete={activeField ? () => handleDeleteField(activeField) : undefined}
            />
          }
          console={
            <ConsolePanel
              isOpen={consoleOpen}
              onToggle={() => setConsoleOpen((o) => !o)}
              messages={consoleMessages}
            />
          }
        />
      </DndContext>

      {/* Autosave status, Discard changes and View live */}
      <div
        style={{
          position: 'fixed',
          bottom: consoleOpen ? '168px' : '36px',
          right: '296px',
          zIndex: 30,
          transition: 'bottom 0.2s ease',
        }}
      >
        <DraftStatusBar
          status={draft.status}
          statusMessage={draft.statusMessage}
          savedAt={draft.savedAt}
          hasUnpublishedChanges={draft.hasUnpublishedChanges}
          hasBeenPublished={draft.hasBeenPublished}
          liveUrl={draft.formStatus === 'published' && draft.slug ? `/f/${draft.slug}` : null}
          onDiscard={handleDiscard}
          onReload={draft.reload}
        />
      </div>

      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onConfirm={handlePublishConfirm}
        isPublishing={draft.isPublishing}
        currentVisibility={
          draft.hasBeenPublished ? (form.visibility === 'public' ? 'public' : 'unlisted') : undefined
        }
      />
    </>
  );
}

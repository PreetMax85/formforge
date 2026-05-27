'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
import { FormRenderer } from '~/components/form/FormRenderer';
import LoadingScreen from '~/components/shared/LoadingScreen';

import type { Field, FieldType } from '~/lib/types/field';

/** Generate a stable temporary ID for new (unsaved) fields */
function tempId(): string {
  return `temp-${Date.now()}-${crypto.randomUUID().slice(0, 5)}`;
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
      className="flex items-center justify-center w-full h-screen"
      style={{ background: '#1e1e1e', color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}
    >
      {children}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function BuilderPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  /* ── Server state ────────────────────────────────────────────── */
  const utils = trpc.useUtils();
  const {
    data: response,
    isLoading,
    error,
  } = trpc.forms.byId.useQuery({ id: formId });

  const form = response?.data;

  /* ── Local UI state ──────────────────────────────────────────── */
  const [fields, setFields] = useState<Field[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const consoleRef = useRef<ConsoleMessage[]>([]);

  const MAX_CONSOLE_LINES = 200;

  function pushLog(type: ConsoleMessage['type'], text: string) {
    consoleRef.current = [...consoleRef.current.slice(-(MAX_CONSOLE_LINES - 1)), { type, text }];
    setConsoleMessages(consoleRef.current);
  }

  /* Sync server fields to local state once on load */
  useEffect(() => {
    if (form) {
      const loadedFields = (form.fields as Field[]) ?? [];
      setFields(loadedFields);
      consoleRef.current = [];
      pushLog(
        'success',
        `Scene loaded: "${form.title}" (${loadedFields.length} fields${loadedFields.length === 0 ? ', empty scene' : ''})`
      );
    }
  }, [form?.id]);

  /* ── Mutations ───────────────────────────────────────────────── */
  // Note: order is part of the upsertMany payload, so we no longer fire a
  // separate reorder mutation on every drag. Reorder happens on Save.
  const upsertMutation = trpc.fields.upsertMany.useMutation({
    onError: (err) => {
      pushLog('error', `Save failed: ${err.message}`);
      toast.error(err.message);
    },
  });

  const deleteFieldMutation = trpc.fields.delete.useMutation({
    onError: (err) => {
      pushLog('error', `Delete failed: ${err.message}`);
      toast.error(err.message);
    },
  });

  const publishMutation = trpc.forms.publish.useMutation({
    onSuccess: () => {
      pushLog('success', 'Form published — now accepting responses');
      toast.success('Form published!');
      setPublishModalOpen(false);
    },
    onError: (err) => {
      pushLog('error', `Publish failed: ${err.message}`);
      toast.error(err.message);
    },
  });

  /* ── DnD sensors ─────────────────────────────────────────────── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
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
        const type = active.data.current?.type as FieldType;
        const label = defaultLabel(type);
        const newField: Field = {
          id: tempId(),
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
        setFields((prev) => [...prev, { ...newField, order: prev.length }]);
        setActiveFieldId(newField.id);
        setIsDirty(true);
        pushLog('info', `Asset "${label}" added to scene (unsaved)`);
        return;
      }

      // Reorder existing fields — local only; persisted on Save via upsertMany
      if (activeId !== overId && !activeId.startsWith('palette-')) {
        setFields((prev) => {
          const oldIndex = prev.findIndex((f) => f.id === activeId);
          const newIndex = prev.findIndex((f) => f.id === overId);
          if (oldIndex === -1 || newIndex === -1) return prev;
          return arrayMove(prev, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }));
        });
        setIsDirty(true);
      }
    },
    [formId]
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
    setIsDirty(true);
  }, [activeFieldId]);

  /* ── Save ────────────────────────────────────────────────────── */
  function handleSave() {
    // Snapshot pre-save state so we can remap activeFieldId by index after
    // temp IDs become real UUIDs.
    const preSaveActiveId = activeFieldId;
    const preSaveOrder    = fields.map((f) => f.id);

    upsertMutation.mutate(
      {
        formId,
        fields: fields.map((f, i) => ({
          ...(f.id.startsWith('temp-') ? {} : { id: f.id }),
          formId,
          type:        f.type,
          label:       f.label,
          placeholder: f.placeholder ?? undefined,
          description: f.description ?? undefined,
          required:    f.required,
          order:       i,
          config:      f.config,
          conditions:  f.conditions ?? undefined,
        })),
      },
      {
        onSuccess: (res) => {
          const newFields = (res.data?.fields ?? []) as unknown as Field[];
          setFields(newFields);
          setIsDirty(false);
          pushLog('success', `Saved ${newFields.length} fields`);
          toast.success('Fields saved.');
          void utils.forms.byId.invalidate({ id: formId });

          // Remap activeFieldId by position — array order matches `order` ASC
          if (preSaveActiveId) {
            const oldIdx = preSaveOrder.indexOf(preSaveActiveId);
            if (oldIdx >= 0 && newFields[oldIdx]) {
              setActiveFieldId(newFields[oldIdx].id);
            } else {
              setActiveFieldId(null);
            }
          }
        },
      }
    );
  }

  /* ── Reset ───────────────────────────────────────────────────── */
  function handleReset() {
    toast('Discard all changes?', {
      description: 'All unsaved changes will be lost.',
      action: {
        label: 'Discard',
        onClick: () => {
          const serverFields = (form?.fields as Field[]) ?? [];
          setFields(serverFields);
          setActiveFieldId(null);
          setIsDirty(false);
          pushLog('info', 'Scene reset to last saved state');
        },
      },
    });
  }

  /* ── Delete field ────────────────────────────────────────────── */
  function handleDeleteField(field: Field) {
    const isTemp = field.id.startsWith('temp-');
    const label  = field.label || 'this field';

    toast(`Delete "${label}"?`, {
      description: isTemp
        ? 'It hasn\'t been saved yet.'
        : 'This will also delete all of its responses.',
      action: {
        label: 'Delete',
        onClick: () => {
          if (isTemp) {
            setFields((prev) => prev.filter((f) => f.id !== field.id));
            if (activeFieldId === field.id) setActiveFieldId(null);
            setIsDirty(true);
            pushLog('info', `Removed "${label}" from scene`);
            return;
          }
          deleteFieldMutation.mutate(
            { id: field.id },
            {
              onSuccess: () => {
                setFields((prev) => prev.filter((f) => f.id !== field.id));
                if (activeFieldId === field.id) setActiveFieldId(null);
                pushLog('info', `Deleted "${label}" and its responses`);
                toast.success('Field deleted.');
                void utils.forms.byId.invalidate({ id: formId });
              },
            }
          );
        },
      },
    });
  }

  /* ── Play (preview) ──────────────────────────────────────────── */
  function handlePlay() {
    if (isDirty) {
      toast('Save your changes first before previewing.', {
        action: { label: 'Save', onClick: handleSave },
      });
      return;
    }
    setPreviewOpen(true);
  }

  /* ── Publish ─────────────────────────────────────────────────── */
  function handlePublishConfirm(visibility: 'public' | 'unlisted') {
    publishMutation.mutate({ id: formId, visibility });
  }

  /* ── Active field ────────────────────────────────────────────── */
  const activeField = fields.find((f) => f.id === activeFieldId) ?? null;

  /* ── 4-state async pattern ───────────────────────────────────── */
  if (isLoading) {
    return <LoadingScreen variant="fullscreen" />;
  }

  if (error) {
    return (
      <FullscreenMessage>
        <span style={{ color: '#ef4444' }}>
          [ERROR] {error.message}
        </span>
      </FullscreenMessage>
    );
  }

  if (!form) {
    return <FullscreenMessage>Form not found in scene.</FullscreenMessage>;
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
            title: form.title,
            description: form.description,
            theme: form.theme,
            showProgressBar: form.showProgressBar,
            requireEmail: form.requireEmail,
            allowAnonymous: form.allowAnonymous,
            thankYouTitle: form.thankYouTitle,
            thankYouMessage: form.thankYouMessage,
            fields: fields as Field[],
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
              formTitle={form.title}
              formId={formId}
              onPlay={handlePlay}
              onPublish={() => setPublishModalOpen(true)}
              isPublishing={publishMutation.isPending}
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
              <FieldPalette />
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

      {/* Save & Reset buttons — shown when dirty */}
      {isDirty && (
        <div
          style={{
            position: 'fixed',
            bottom: consoleOpen ? '168px' : '36px',
            right: '296px',
            zIndex: 30,
            display: 'flex',
            gap: '8px',
            transition: 'bottom 0.2s ease',
          }}
        >
          <button
            onClick={handleReset}
            style={{
              padding: '6px 16px',
              background: '#252526',
              border: '1px solid #3c3c3c',
              color: '#9ca3af',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#f44336';
              (e.currentTarget as HTMLButtonElement).style.color = '#f44336';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#3c3c3c';
              (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
            }}
          >
            RESET
          </button>
          <button
            onClick={handleSave}
            disabled={upsertMutation.isPending}
            style={{
              padding: '6px 16px',
              background: '#252526',
              border: '1px solid #569cd6',
              color: '#569cd6',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: upsertMutation.isPending ? 'not-allowed' : 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            {upsertMutation.isPending ? 'SAVING...' : '● SAVE CHANGES'}
          </button>
        </div>
      )}

      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onConfirm={handlePublishConfirm}
      />
    </>
  );
}
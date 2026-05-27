'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Layers } from 'lucide-react';
import { FieldCard } from './FieldCard';
import type { Field } from '~/lib/types/field';

interface BuilderCanvasProps {
  fields: Field[];
  onSelect: (id: string) => void;
  activeFieldId: string | null;
}

const DROPPABLE_ID = 'builder-canvas';

/**
 * Center builder canvas — drop target + sortable container.
 * Accepts new field types dragged from FieldPalette.
 * Supports reordering via @dnd-kit SortableContext.
 */
export const BuilderCanvas = React.memo(function BuilderCanvas({
  fields,
  onSelect,
  activeFieldId,
}: BuilderCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: DROPPABLE_ID });

  const isEmpty = fields.length === 0;

  return (
    <div
      ref={setNodeRef}
      className="min-h-full flex flex-col"
      style={{
        padding: '24px',
        outline: isOver ? '2px dashed #569cd6' : '2px dashed transparent',
        outlineOffset: '-12px',
        transition: 'outline 0.15s ease',
        minHeight: '100%',
      }}
    >
      <SortableContext
        items={fields.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        {isEmpty ? (
          /* ── Empty drop zone ─────────────────────────────────── */
          <div
            className="flex flex-col items-center justify-center flex-1"
            style={{
              minHeight: '320px',
              border: '1px dashed #3c3c3c',
              background: isOver ? 'rgba(86,156,214,0.04)' : 'transparent',
              transition: 'background 0.15s ease',
            }}
          >
            <Layers size={32} style={{ color: '#3c3c3c', marginBottom: '12px' }} />
            <p
              style={{
                fontSize: '13px',
                color: '#4b5563',
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: '4px',
              }}
            >
              Scene is empty.
            </p>
            <p
              style={{
                fontSize: '11px',
                color: '#374151',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Drag a component from the palette.
            </p>
          </div>
        ) : (
          /* ── Field cards ─────────────────────────────────────── */
          <div
            className="flex flex-col"
            style={{
              maxWidth: '600px',
              width: '100%',
              margin: '0 auto',
              gap: '0',
              border: '1px solid #2a2a2a',
              background: isOver ? 'rgba(86,156,214,0.02)' : 'transparent',
              transition: 'background 0.15s ease',
            }}
          >
            {fields.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                isActive={field.id === activeFieldId}
                onSelect={onSelect}
              />
            ))}
            {/* Drop-here hint at bottom when canvas has fields */}
            {isOver && (
              <div
                style={{
                  height: '3px',
                  background: '#569cd6',
                  transition: 'all 0.15s',
                }}
              />
            )}
          </div>
        )}
      </SortableContext>
    </div>
  );
});

/** Export the droppable canvas ID so the page can reference it */
export { DROPPABLE_ID };

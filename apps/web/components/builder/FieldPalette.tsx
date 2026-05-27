'use client';

import { useDraggable } from '@dnd-kit/core';
import { FIELD_TYPE_META } from './FieldCard';
import type { FieldType } from '~/lib/types/field';

const FIELD_TYPES: FieldType[] = [
  'short_text',
  'long_text',
  'email',
  'number',
  'single_select',
  'multi_select',
  'checkbox',
  'rating',
  'date',
  'dropdown',
];

interface DraggableFieldButtonProps {
  type: FieldType;
}

/** Single draggable palette item */
function DraggableFieldButton({ type }: DraggableFieldButtonProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  });

  const meta = FIELD_TYPE_META[type];
  const Icon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 px-2.5 py-2 w-full cursor-grab active:cursor-grabbing transition-colors"
      style={{
        background: isDragging ? `${meta.color}18` : 'transparent',
        borderLeft: `2px solid ${isDragging ? meta.color : 'transparent'}`,
        borderBottom: '1px solid #2a2a2a',
        opacity: isDragging ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background = '#2a2a2a';
          el.style.borderLeftColor = meta.color;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background = 'transparent';
          el.style.borderLeftColor = 'transparent';
        }
      }}
    >
      <Icon size={13} style={{ color: meta.color, flexShrink: 0 }} />
      <span
        style={{
          fontSize: '12px',
          color: '#9ca3af',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {meta.label}
      </span>
      <span
        className="ml-auto"
        style={{
          fontSize: '9px',
          color: meta.color,
          fontFamily: "'JetBrains Mono', monospace",
          opacity: 0.7,
        }}
      >
        {meta.shortLabel}
      </span>
    </div>
  );
}

/**
 * Field type palette — rendered inside the HierarchyPanel below the field list.
 * Each item is a @dnd-kit useDraggable source.
 * Drop onto BuilderCanvas to instantiate a new field.
 */
export function FieldPalette() {
  return (
    <div>
      <div
        className="flex items-center px-3 select-none"
        style={{
          height: '24px',
          background: '#333333',
          borderTop: '1px solid #2a2a2a',
          borderBottom: '1px solid #2a2a2a',
          fontSize: '11px',
          color: '#9ca3af',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        Component Palette
      </div>
      <div>
        {FIELD_TYPES.map((type) => (
          <DraggableFieldButton key={type} type={type} />
        ))}
      </div>
    </div>
  );
}
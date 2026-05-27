'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Star, Calendar, Mail, Hash, CheckSquare, ChevronDown, AlignLeft, AlignJustify, List } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Field, FieldType } from '~/lib/types/field';

interface FieldCardProps {
  field: Field;
  isActive: boolean;
  onSelect: (id: string) => void;
}

/** Per-type visual metadata — color, icon, labels */
export const FIELD_TYPE_META: Record<
  FieldType,
  { color: string; icon: React.ElementType; label: string; shortLabel: string }
> = {
  short_text:    { color: '#569cd6', icon: AlignLeft,      label: 'Short Text',     shortLabel: 'TXT'  },
  long_text:     { color: '#569cd6', icon: AlignJustify,   label: 'Long Text',      shortLabel: 'PARA' },
  email:         { color: '#dcdcaa', icon: Mail,           label: 'Email',          shortLabel: 'MAIL' },
  number:        { color: '#569cd6', icon: Hash,           label: 'Number',         shortLabel: 'NUM'  },
  single_select: { color: '#4ec9b0', icon: List,           label: 'Single Select',  shortLabel: 'SEL'  },
  multi_select:  { color: '#4ec9b0', icon: List,           label: 'Multi Select',   shortLabel: 'MSEL' },
  checkbox:      { color: '#4ec9b0', icon: CheckSquare,    label: 'Checkbox',       shortLabel: 'CHK'  },
  rating:        { color: '#ff9800', icon: Star,           label: 'Rating',         shortLabel: 'RTG'  },
  date:          { color: '#c586c0', icon: Calendar,       label: 'Date',           shortLabel: 'DATE' },
  dropdown:      { color: '#4ec9b0', icon: ChevronDown,    label: 'Dropdown',       shortLabel: 'DROP' },
};

/**
 * Sortable field card in the builder canvas.
 * Left border color reflects field type.
 * Framer-motion entrance animation on mount.
 */
export const FieldCard = React.memo(function FieldCard({ field, isActive, onSelect }: FieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const meta = FIELD_TYPE_META[field.type];
  const Icon = meta.icon;
  const hasConditions = !!(
    field.conditions &&
    (field.conditions as Record<string, unknown>).rules &&
    Array.isArray((field.conditions as Record<string, unknown>).rules) &&
    ((field.conditions as Record<string, unknown>).rules as unknown[]).length > 0
  );

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: isDragging ? 0.4 : 1, x: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <div
        onClick={() => onSelect(field.id)}
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors w-full"
        style={{
          background: isActive ? '#094771' : '#252526',
          borderLeft: `3px solid ${meta.color}`,
          borderBottom: '1px solid #2a2a2a',
          outline: isActive ? `1px solid ${meta.color}40` : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLDivElement).style.background = '#2d2d30';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLDivElement).style.background = '#252526';
          }
        }}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-none cursor-grab active:cursor-grabbing p-0.5"
          onClick={(e) => e.stopPropagation()}
          style={{ color: '#3c3c3c' }}
        >
          <GripVertical size={14} />
        </div>

        {/* Type icon */}
        <Icon size={14} style={{ color: meta.color, flexShrink: 0 }} />

        {/* Label + type badge */}
        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
          <span
            className="truncate"
            style={{
              fontSize: '13px',
              color: isActive ? '#d4d4d4' : '#c0c0c0',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
            }}
          >
            {field.label || 'Untitled field'}
          </span>
          <span
            style={{
              fontSize: '10px',
              color: meta.color,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.04em',
              opacity: 0.8,
            }}
          >
            {meta.label}
          </span>
        </div>

        {/* Conditional logic badge */}
        {hasConditions && (
          <span
            style={{
              fontSize: '9px',
              color: '#c586c0',
              fontFamily: "'JetBrains Mono', monospace",
              background: 'rgba(197,134,192,0.12)',
              padding: '1px 5px',
              flexShrink: 0,
              letterSpacing: '0.04em',
            }}
          >
            IF
          </span>
        )}

        {/* Required badge */}
        {field.required && (
          <span
            style={{
              fontSize: '9px',
              color: '#ef4444',
              fontFamily: "'JetBrains Mono', monospace",
              background: 'rgba(239,68,68,0.12)',
              padding: '1px 5px',
              flexShrink: 0,
              letterSpacing: '0.04em',
            }}
          >
            REQ
          </span>
        )}
      </div>
    </motion.div>
  );
});

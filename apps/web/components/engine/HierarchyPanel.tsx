'use client';

import { GripVertical, GitBranch } from 'lucide-react';
import { FIELD_TYPE_META } from '~/components/builder/FieldCard';
import type { Field } from '~/lib/types/field';

interface HierarchyPanelProps {
  fields: Field[];
  activeFieldId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Left-side Project Hierarchy panel.
 * Lists all form fields in order with their type badge and drag handle indicator.
 * Clicking a field selects it in the Inspector.
 */
export function HierarchyPanel({ fields, activeFieldId, onSelect }: HierarchyPanelProps) {
  if (fields.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full px-4 text-center"
        style={{ gap: '8px' }}
      >
        <span style={{ fontSize: '11px', color: '#4b5563', fontFamily: "'JetBrains Mono', monospace" }}>
          No assets in scene.
        </span>
        <span style={{ fontSize: '10px', color: '#374151', fontFamily: "'JetBrains Mono', monospace" }}>
          Drag a field to instantiate.
        </span>
      </div>
    );
  }

  return (
    <ul className="py-1" role="listbox" aria-label="Form fields">
      {fields.map((field, idx) => {
        const meta = FIELD_TYPE_META[field.type];
        const isActive = field.id === activeFieldId;
        const hasConditions = !!(
          field.conditions &&
          (field.conditions as Record<string, unknown>).rules &&
          Array.isArray((field.conditions as Record<string, unknown>).rules) &&
          ((field.conditions as Record<string, unknown>).rules as unknown[]).length > 0
        );

        return (
          <li key={field.id}>
            <button
              role="option"
              aria-selected={isActive}
              onClick={() => onSelect(field.id)}
              className="w-full flex items-center gap-2 px-2 py-1 text-left transition-colors"
              style={{
                background: isActive ? '#094771' : 'transparent',
                borderLeft: isActive ? `2px solid ${meta.color}` : '2px solid transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              {/* Index */}
              <span
                style={{
                  fontSize: '10px',
                  color: '#4b5563',
                  fontFamily: "'JetBrains Mono', monospace",
                  width: '16px',
                  flexShrink: 0,
                }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Type badge */}
              <span
                style={{
                  fontSize: '9px',
                  color: meta.color,
                  fontFamily: "'JetBrains Mono', monospace",
                  background: `${meta.color}18`,
                  padding: '1px 4px',
                  flexShrink: 0,
                  letterSpacing: '0.04em',
                }}
              >
                {meta.shortLabel}
              </span>

              {/* Label */}
              <span
                className="truncate flex-1"
                style={{
                  fontSize: '12px',
                  color: isActive ? '#d4d4d4' : '#9ca3af',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {field.label || 'Untitled field'}
              </span>

              {/* Conditional indicator */}
              {hasConditions && (
                <GitBranch
                  size={10}
                  style={{ color: '#c586c0', flexShrink: 0 }}
                />
              )}

              {/* Grip */}
              <GripVertical
                size={12}
                style={{ color: '#3c3c3c', flexShrink: 0 }}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
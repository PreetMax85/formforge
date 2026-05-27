'use client';

import { Plus, Trash2 } from 'lucide-react';
import { FIELD_TYPE_META } from './FieldCard';
import type { Field } from '~/lib/types/field';

interface FieldInspectorProps {
  field: Field;
  onChange: (updated: Partial<Field>) => void;
  onDelete?: () => void;
}

/* ── Shared input style ───────────────────────────────────────────── */
const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: '#1e1e1e',
  border: '1px solid #3c3c3c',
  color: '#d4d4d4',
  padding: '4px 8px',
  fontSize: '12px',
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
};

/* ── Property row — alternating bg via nth-child ─────────────────── */
function PropRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-1 px-3 py-2 prop-row"
      style={{
        borderBottom: '1px solid #2a2a2a',
      }}
    >
      <label
        style={{
          fontSize: '10px',
          color: '#6b7280',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * Editable property grid for a selected form field.
 * Renders different config controls based on field type.
 */
export function FieldInspector({ field, onChange, onDelete }: FieldInspectorProps) {
  const meta = FIELD_TYPE_META[field.type];
  const Icon = meta.icon;

  /* Type-specific config helpers */
  const options = (field.config.options as string[] | undefined) ?? [];
  const isSelectType =
    field.type === 'single_select' ||
    field.type === 'multi_select' ||
    field.type === 'dropdown';
  const isRating = field.type === 'rating';
  const isNumber = field.type === 'number';

  function setConfig(key: string, value: unknown) {
    onChange({ config: { ...field.config, [key]: value } });
  }

  function addOption() {
    setConfig('options', [...options, '']);
  }

  function updateOption(idx: number, value: string) {
    const next = [...options];
    next[idx] = value;
    setConfig('options', next);
  }

  function removeOption(idx: number) {
    setConfig(
      'options',
      options.filter((_, i) => i !== idx)
    );
  }

  return (
    <div>
      {/* ── Type header ─────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          background: `${meta.color}12`,
          borderBottom: `1px solid ${meta.color}30`,
        }}
      >
        <Icon size={13} style={{ color: meta.color }} />
        <span
          style={{
            fontSize: '11px',
            color: meta.color,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {meta.label}
        </span>
        <span
          style={{
            fontSize: '9px',
            color: '#6b7280',
            fontFamily: "'JetBrains Mono', monospace",
            marginLeft: 'auto',
          }}
        >
          {field.id.startsWith('temp-') ? 'UNSAVED' : field.id.slice(0, 8)}
        </span>
      </div>

      {/* ── Label ───────────────────────────────────────────── */}
      <PropRow label="Label">
        <input
          style={INPUT_STYLE}
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#3c3c3c')}
          placeholder="Field label"
        />
      </PropRow>

      {/* ── Placeholder (not for checkbox/rating) ───────────── */}
      {field.type !== 'checkbox' && field.type !== 'rating' && (
        <PropRow label="Placeholder">
          <input
            style={INPUT_STYLE}
            value={field.placeholder ?? ''}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#3c3c3c')}
            placeholder="e.g. Enter your answer..."
          />
        </PropRow>
      )}

      {/* ── Description ─────────────────────────────────────── */}
      <PropRow label="Description">
        <textarea
          style={{
            ...INPUT_STYLE,
            resize: 'vertical',
            minHeight: '52px',
          }}
          value={field.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#3c3c3c')}
          placeholder="Optional hint text"
        />
      </PropRow>

      {/* ── Required toggle ─────────────────────────────────── */}
      <PropRow label="Required">
        <div className="flex items-center gap-2">
          <button
            role="switch"
            aria-checked={field.required}
            onClick={() => onChange({ required: !field.required })}
            style={{
              width: '32px',
              height: '16px',
              background: field.required ? '#569cd6' : '#3c3c3c',
              border: '1px solid #5c5c5c',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '1px',
                left: field.required ? '15px' : '1px',
                width: '12px',
                height: '12px',
                background: '#d4d4d4',
                transition: 'left 0.15s',
              }}
            />
          </button>
          <span style={{ fontSize: '11px', color: field.required ? '#d4d4d4' : '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
            {field.required ? 'Yes' : 'No'}
          </span>
        </div>
      </PropRow>

      {/* ── Rating max ──────────────────────────────────────── */}
      {isRating && (
        <PropRow label="Max Stars">
          <div className="flex gap-2">
            {([5, 10] as const).map((n) => (
              <button
                key={n}
                onClick={() => setConfig('max', n)}
                style={{
                  padding: '2px 12px',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  background:
                    (field.config.max ?? 5) === n ? '#569cd6' : '#2a2a2a',
                  color:
                    (field.config.max ?? 5) === n ? '#0e0e0e' : '#9ca3af',
                  border: '1px solid #3c3c3c',
                  cursor: 'pointer',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </PropRow>
      )}

      {/* ── Number min/max ──────────────────────────────────── */}
      {isNumber && (
        <>
          <PropRow label="Min Value">
            <input
              type="number"
              style={INPUT_STYLE}
              value={(field.config.min as number | undefined) ?? ''}
              onChange={(e) =>
                setConfig('min', e.target.value !== '' ? Number(e.target.value) : undefined)
              }
              onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#3c3c3c')}
              placeholder="No minimum"
            />
          </PropRow>
          <PropRow label="Max Value">
            <input
              type="number"
              style={INPUT_STYLE}
              value={(field.config.max as number | undefined) ?? ''}
              onChange={(e) =>
                setConfig('max', e.target.value !== '' ? Number(e.target.value) : undefined)
              }
              onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#3c3c3c')}
              placeholder="No maximum"
            />
          </PropRow>
        </>
      )}

      {/* ── Options (select / multi_select / dropdown) ──────── */}
      {isSelectType && (
        <PropRow label={`Options (${options.length})`}>
          <div className="flex flex-col gap-1">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-1">
                <input
                  style={{ ...INPUT_STYLE, flex: 1 }}
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#3c3c3c')}
                  placeholder={`Option ${idx + 1}`}
                />
                <button
                  onClick={() => removeOption(idx)}
                  style={{
                    padding: '4px 6px',
                    background: 'transparent',
                    border: '1px solid #3c3c3c',
                    color: '#6b7280',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color = '#ef4444')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color = '#6b7280')
                  }
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            <button
              onClick={addOption}
              className="flex items-center gap-1.5 mt-1"
              style={{
                background: 'transparent',
                border: '1px dashed #3c3c3c',
                color: '#6b7280',
                padding: '3px 8px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#569cd6';
                (e.currentTarget as HTMLButtonElement).style.color = '#569cd6';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#3c3c3c';
                (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
              }}
            >
              <Plus size={11} />
              Add option
            </button>
          </div>
        </PropRow>
      )}

      {/* ── Delete field ────────────────────────────────────── */}
      {onDelete && (
        <div className="px-3 py-3" style={{ borderTop: '1px solid #2a2a2a' }}>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 w-full"
            style={{
              background: 'transparent',
              border: '1px solid #3c3c3c',
              color: '#9ca3af',
              padding: '6px 10px',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'border-color 0.12s, color 0.12s, background 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#3c3c3c';
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Trash2 size={12} />
            DELETE FIELD
          </button>
        </div>
      )}
    </div>
  );
}
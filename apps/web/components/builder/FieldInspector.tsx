'use client';

import { Plus, Trash2, GitBranch } from 'lucide-react';
import { FIELD_TYPE_META } from './FieldCard';
import type { Field } from '~/lib/types/field';

type ConditionAction   = 'show' | 'hide';
type ConditionMatch    = 'any' | 'all';
type ConditionOperator =
  | 'equals' | 'not_equals' | 'contains'
  | 'greater_than' | 'less_than'
  | 'is_empty' | 'is_not_empty';

interface ConditionRule {
  sourceFieldId: string;
  operator:      ConditionOperator;
  value:         string;
}

interface ConditionLogic {
  action: ConditionAction;
  match:  ConditionMatch;
  rules:  ConditionRule[];
}

const OPERATOR_OPTIONS: { value: ConditionOperator; label: string; needsValue: boolean }[] = [
  { value: 'equals',        label: 'equals',         needsValue: true  },
  { value: 'not_equals',    label: 'not equals',     needsValue: true  },
  { value: 'contains',      label: 'contains',       needsValue: true  },
  { value: 'greater_than',  label: 'greater than',   needsValue: true  },
  { value: 'less_than',     label: 'less than',      needsValue: true  },
  { value: 'is_empty',      label: 'is empty',       needsValue: false },
  { value: 'is_not_empty',  label: 'is not empty',   needsValue: false },
];

interface FieldInspectorProps {
  field: Field;
  allFields: Field[];
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
export function FieldInspector({ field, allFields, onChange, onDelete }: FieldInspectorProps) {
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

  /* ── Conditional-logic helpers ──────────────────────────────────── */
  // Source candidates: persisted (non-temp) fields, excluding the current one.
  // Temp-ID fields can't be referenced because the backend schema requires
  // sourceFieldId to be a real UUID. The user is prompted to save first.
  const sourceCandidates = allFields.filter(
    (f) => f.id !== field.id && !f.id.startsWith('temp-')
  );
  const conditions = (field.conditions as ConditionLogic | null | undefined) ?? null;
  const hasConditions = conditions !== null && conditions.rules.length > 0;

  function setConditions(next: ConditionLogic | null) {
    onChange({ conditions: next });
  }

  function initConditions() {
    if (sourceCandidates.length === 0) return;
    setConditions({
      action: 'show',
      match:  'any',
      rules:  [
        { sourceFieldId: sourceCandidates[0]!.id, operator: 'equals', value: '' },
      ],
    });
  }

  function updateRule(idx: number, patch: Partial<ConditionRule>) {
    if (!conditions) return;
    const nextRules = conditions.rules.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setConditions({ ...conditions, rules: nextRules });
  }

  function addRule() {
    if (!conditions || sourceCandidates.length === 0) return;
    setConditions({
      ...conditions,
      rules: [
        ...conditions.rules,
        { sourceFieldId: sourceCandidates[0]!.id, operator: 'equals', value: '' },
      ],
    });
  }

  function removeRule(idx: number) {
    if (!conditions) return;
    const nextRules = conditions.rules.filter((_, i) => i !== idx);
    if (nextRules.length === 0) {
      // Clear conditions entirely — field becomes always-visible
      setConditions(null);
      return;
    }
    setConditions({ ...conditions, rules: nextRules });
  }

  function getSourceField(id: string): Field | undefined {
    return allFields.find((f) => f.id === id);
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

      {/* ── Visibility logic ────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #2a2a2a' }}>
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{
            background: hasConditions ? 'rgba(197, 134, 192, 0.08)' : 'transparent',
            borderBottom: '1px solid #2a2a2a',
          }}
        >
          <GitBranch size={11} style={{ color: '#c586c0' }} />
          <span
            style={{
              fontSize: '10px',
              color: '#c586c0',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Visibility Logic
          </span>
          {hasConditions && (
            <button
              onClick={() => setConditions(null)}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ef4444')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#6b7280')}
              aria-label="Clear all visibility rules"
            >
              CLEAR
            </button>
          )}
        </div>

        <div className="px-3 py-2" style={{ borderBottom: '1px solid #2a2a2a' }}>
          {sourceCandidates.length === 0 ? (
            <p
              style={{
                fontSize: '11px',
                color: '#6b7280',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.5,
              }}
            >
              {allFields.length <= 1
                ? 'Add another field first to reference in visibility rules.'
                : 'Save your other fields first — visibility rules can only reference saved fields.'}
            </p>
          ) : !hasConditions ? (
            <button
              onClick={initConditions}
              className="flex items-center justify-center gap-1.5 w-full"
              style={{
                background: 'transparent',
                border: '1px dashed #3c3c3c',
                color: '#6b7280',
                padding: '6px 8px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#c586c0';
                (e.currentTarget as HTMLButtonElement).style.color = '#c586c0';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#3c3c3c';
                (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
              }}
            >
              <Plus size={11} />
              Add visibility rule
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Action + match selector */}
              <div
                className="flex items-center flex-wrap gap-1"
                style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <select
                  value={conditions!.action}
                  onChange={(e) =>
                    setConditions({ ...conditions!, action: e.target.value as ConditionAction })
                  }
                  style={{ ...INPUT_STYLE, width: 'auto', padding: '2px 4px' }}
                >
                  <option value="show">SHOW</option>
                  <option value="hide">HIDE</option>
                </select>
                <span>this field when</span>
                <select
                  value={conditions!.match}
                  onChange={(e) =>
                    setConditions({ ...conditions!, match: e.target.value as ConditionMatch })
                  }
                  style={{ ...INPUT_STYLE, width: 'auto', padding: '2px 4px' }}
                >
                  <option value="any">ANY</option>
                  <option value="all">ALL</option>
                </select>
                <span>of:</span>
              </div>

              {/* Rules list */}
              {conditions!.rules.map((rule, idx) => {
                const opMeta  = OPERATOR_OPTIONS.find((o) => o.value === rule.operator);
                const src     = getSourceField(rule.sourceFieldId);
                const srcOpts = (src?.config.options as string[] | undefined) ?? [];
                const srcIsSelect = src
                  ? src.type === 'single_select' || src.type === 'multi_select' || src.type === 'dropdown'
                  : false;

                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-1"
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      padding: '6px',
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <select
                        value={rule.sourceFieldId}
                        onChange={(e) => updateRule(idx, { sourceFieldId: e.target.value })}
                        style={{ ...INPUT_STYLE, flex: 1, padding: '3px 4px' }}
                      >
                        {sourceCandidates.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label || 'Untitled'}
                          </option>
                        ))}
                        {/* If source no longer in candidates (e.g. deleted), keep the value visible */}
                        {!sourceCandidates.find((f) => f.id === rule.sourceFieldId) && (
                          <option value={rule.sourceFieldId}>(missing source)</option>
                        )}
                      </select>
                      <button
                        onClick={() => removeRule(idx)}
                        aria-label="Remove rule"
                        style={{
                          padding: '3px 5px',
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
                        <Trash2 size={10} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <select
                        value={rule.operator}
                        onChange={(e) =>
                          updateRule(idx, { operator: e.target.value as ConditionOperator })
                        }
                        style={{ ...INPUT_STYLE, width: 'auto', padding: '3px 4px' }}
                      >
                        {OPERATOR_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      {opMeta?.needsValue && (
                        srcIsSelect && srcOpts.length > 0 ? (
                          <select
                            value={rule.value}
                            onChange={(e) => updateRule(idx, { value: e.target.value })}
                            style={{ ...INPUT_STYLE, flex: 1, padding: '3px 4px' }}
                          >
                            <option value="">— select —</option>
                            {srcOpts.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={rule.value}
                            onChange={(e) => updateRule(idx, { value: e.target.value })}
                            placeholder="value"
                            style={{ ...INPUT_STYLE, flex: 1, padding: '3px 4px' }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#c586c0')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = '#3c3c3c')}
                          />
                        )
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add another rule */}
              {conditions!.rules.length < 10 && (
                <button
                  onClick={addRule}
                  className="flex items-center justify-center gap-1.5"
                  style={{
                    background: 'transparent',
                    border: '1px dashed #3c3c3c',
                    color: '#6b7280',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#c586c0';
                    (e.currentTarget as HTMLButtonElement).style.color = '#c586c0';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#3c3c3c';
                    (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                  }}
                >
                  <Plus size={11} />
                  Add another rule
                </button>
              )}
            </div>
          )}
        </div>
      </div>

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
'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Star } from 'lucide-react';
import type { Field } from '~/lib/types/field';

interface FormFieldProps {
  field: Field;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  error?: string;
}

/* ── Shared input base styles (inline so CSS vars resolve correctly) ─ */
const BASE_INPUT: CSSProperties = {
  width:       '100%',
  padding:     '12px 16px',
  background:  'var(--bg-secondary)',
  border:      '1px solid var(--border)',
  color:       'var(--text-primary)',
  fontSize:    '16px',
  fontFamily:  "'Inter', sans-serif",
  outline:     'none',
  transition:  'border-color 0.15s',
  borderRadius: 0,
};

function focusStyle(el: HTMLElement) {
  el.style.borderColor = 'var(--text-accent)';
}
function blurStyle(el: HTMLElement) {
  el.style.borderColor = 'var(--border)';
}

/**
 * Renders a single form field based on its type.
 * All inputs use CSS variables — fully theme-aware.
 */
export function FormField({ field, value, onChange, error }: FormFieldProps) {
  const strVal  = Array.isArray(value) ? '' : (value ?? '');
  const arrVal  = Array.isArray(value) ? value : [];
  const options = Array.isArray(field.config.options)
    && field.config.options.every((o): o is string => typeof o === 'string')
    ? field.config.options
    : [];

  const maxSelections = typeof field.config.maxSelections === 'number'
    ? field.config.maxSelections
    : Infinity;

  function toggleArrayValue(opt: string) {
    if (arrVal.includes(opt)) {
      onChange(arrVal.filter((v) => v !== opt));
    } else if (arrVal.length < maxSelections) {
      onChange([...arrVal, opt]);
    }
  }

  let input: ReactNode;

  switch (field.type) {
    /* ── Short text ─────────────────────────────────────────────── */
    case 'short_text':
      input = (
        <input
          type="text"
          style={BASE_INPUT}
          value={strVal}
          placeholder={field.placeholder ?? 'Your answer'}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => focusStyle(e.currentTarget)}
          onBlur={(e)  => blurStyle(e.currentTarget)}
        />
      );
      break;

    /* ── Long text ──────────────────────────────────────────────── */
    case 'long_text':
      input = (
        <textarea
          style={{ ...BASE_INPUT, minHeight: '140px', resize: 'vertical' }}
          value={strVal}
          placeholder={field.placeholder ?? 'Your answer'}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => focusStyle(e.currentTarget)}
          onBlur={(e)  => blurStyle(e.currentTarget)}
        />
      );
      break;

    /* ── Email ──────────────────────────────────────────────────── */
    case 'email':
      input = (
        <input
          type="email"
          style={BASE_INPUT}
          value={strVal}
          placeholder={field.placeholder ?? 'you@example.com'}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => focusStyle(e.currentTarget)}
          onBlur={(e)  => blurStyle(e.currentTarget)}
        />
      );
      break;

    /* ── Number ─────────────────────────────────────────────────── */
    case 'number': {
      const min = typeof field.config.min === 'number' ? field.config.min : undefined;
      const max = typeof field.config.max === 'number' ? field.config.max : undefined;
      input = (
        <div>
          <input
            type="number"
            style={BASE_INPUT}
            value={strVal}
            placeholder={field.placeholder ?? '0'}
            min={min}
            max={max}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => focusStyle(e.currentTarget)}
            onBlur={(e)  => blurStyle(e.currentTarget)}
            onWheel={(e) => e.currentTarget.blur()}
          />
          <p
            style={{
              marginTop:  '6px',
              fontSize:   '11px',
              color:      'var(--text-secondary)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Use ↑↓ arrow keys or type to enter a number
          </p>
        </div>
      );
      break;
    }

    /* ── Date ───────────────────────────────────────────────────── */
    case 'date': {
      const minDate = typeof field.config.minDate === 'string' ? field.config.minDate : undefined;
      const maxDate = typeof field.config.maxDate === 'string' ? field.config.maxDate : undefined;
      input = (
        <input
          type="date"
          style={BASE_INPUT}
          value={strVal}
          min={minDate}
          max={maxDate}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => focusStyle(e.currentTarget)}
          onBlur={(e)  => blurStyle(e.currentTarget)}
        />
      );
      break;
    }

    /* ── Checkbox (single boolean) ──────────────────────────────── */
    case 'checkbox': {
      const checked = strVal === 'true';
      input = (
        <button
          role="checkbox"
          aria-checked={checked}
          onClick={() => onChange(checked ? 'false' : 'true')}
          className="flex items-start gap-3 text-left w-full"
          style={{
            padding:    '14px 16px',
            background: checked ? 'color-mix(in srgb, var(--text-accent) 12%, transparent)' : 'var(--bg-secondary)',
            border:     `1px solid ${checked ? 'var(--text-accent)' : 'var(--border)'}`,
            color:      'var(--text-primary)',
            cursor:     'pointer',
            transition: 'all 0.15s',
          }}
        >
          <span
            style={{
              width:        '18px',
              height:       '18px',
              border:       `1px solid ${checked ? 'var(--text-accent)' : 'var(--border)'}`,
              background:   checked ? 'var(--text-accent)' : 'transparent',
              flexShrink:   0,
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              marginTop:    '1px',
              transition:   'all 0.15s',
            }}
          >
            {checked && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="#0e0e0e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
          <span
            style={{
              fontSize:    '15px',
              fontFamily:  "'Inter', sans-serif",
              color:        checked ? 'var(--text-primary)' : 'var(--text-secondary)',
              lineHeight:   '1.5',
            }}
          >
            I agree to the above
          </span>
        </button>
      );
      break;
    }

    /* ── Single select ──────────────────────────────────────────── */
    case 'single_select':
      input = (
        <div className="flex flex-col gap-2">
          {options.map((opt) => {
            const selected = strVal === opt;
            return (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className="flex items-center gap-3 text-left w-full"
                style={{
                  padding:    '12px 16px',
                  background: selected ? 'color-mix(in srgb, var(--text-accent) 12%, transparent)' : 'var(--bg-secondary)',
                  border:     `1px solid ${selected ? 'var(--text-accent)' : 'var(--border)'}`,
                  color:      selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor:     'pointer',
                  transition: 'all 0.15s',
                  fontSize:   '15px',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (!selected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text-accent)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span
                  style={{
                    width:        '16px',
                    height:       '16px',
                    borderRadius: '50%',
                    border:       `1px solid ${selected ? 'var(--text-accent)' : 'var(--border)'}`,
                    background:   selected ? 'var(--text-accent)' : 'transparent',
                    flexShrink:   0,
                    transition:   'all 0.15s',
                  }}
                />
                {opt}
              </button>
            );
          })}
        </div>
      );
      break;

    /* ── Multi select ───────────────────────────────────────────── */
    case 'multi_select':
      input = (
        <div className="flex flex-col gap-2">
          {options.map((opt) => {
            const selected = arrVal.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggleArrayValue(opt)}
                className="flex items-center gap-3 text-left w-full"
                style={{
                  padding:    '12px 16px',
                  background: selected ? 'color-mix(in srgb, var(--text-accent) 12%, transparent)' : 'var(--bg-secondary)',
                  border:     `1px solid ${selected ? 'var(--text-accent)' : 'var(--border)'}`,
                  color:      selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor:     'pointer',
                  transition: 'all 0.15s',
                  fontSize:   '15px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <span
                  style={{
                    width:      '16px',
                    height:     '16px',
                    border:     `1px solid ${selected ? 'var(--text-accent)' : 'var(--border)'}`,
                    background: selected ? 'var(--text-accent)' : 'transparent',
                    flexShrink: 0,
                    display:    'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {selected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="#0e0e0e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      );
      break;

    /* ── Dropdown ───────────────────────────────────────────────── */
    case 'dropdown':
      input = (
        <select
          style={{ ...BASE_INPUT, appearance: 'none', cursor: 'pointer' }}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => focusStyle(e.currentTarget)}
          onBlur={(e)  => blurStyle(e.currentTarget)}
        >
          <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
            {field.placeholder ?? 'Select an option'}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              {opt}
            </option>
          ))}
        </select>
      );
      break;

    /* ── Rating ─────────────────────────────────────────────────── */
    case 'rating': {
      const rawMax = field.config.max;
      const max    = (rawMax === 5 || rawMax === 10) ? rawMax : 5;
      const numRating = strVal ? Number(strVal) : 0;
      input = (
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => onChange(String(n))}
              title={`${n} star${n !== 1 ? 's' : ''}`}
              style={{
                background: 'transparent',
                border:     'none',
                cursor:     'pointer',
                padding:    '2px',
                color:      n <= numRating ? 'var(--text-accent)' : 'var(--border)',
                transition: 'color 0.1s, transform 0.1s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              <Star
                size={max === 10 ? 28 : 36}
                fill={n <= numRating ? 'var(--text-accent)' : 'none'}
              />
            </button>
          ))}
        </div>
      );
      break;
    }

    default:
      input = (
        <p
          style={{
            color:       '#ef4444',
            fontSize:    '13px',
            fontFamily:  "'JetBrains Mono', monospace",
            padding:     '12px 16px',
            background:  'rgba(239,68,68,0.08)',
            border:      '1px solid rgba(239,68,68,0.25)',
          }}
        >
          Unsupported field type: {field.type}
        </p>
      );
  }

  return (
    <div className="w-full">
      {input}
      {/* Error */}
      {error && (
        <p
          style={{
            marginTop:  '8px',
            fontSize:   '12px',
            color:      '#ef4444',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
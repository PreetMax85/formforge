'use client';

import { use, useState, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { trpc } from '~/trpc/client';
import { FORM_THEMES, THEME_META } from '@repo/shared';
import { Save, AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import LoadingScreen from '~/components/shared/LoadingScreen';
import { useDelayedLoading } from '~/lib/hooks/useDelayedLoading';
import { toast } from 'sonner';

/* ── Shared input styles ──────────────────────────────────────────── */
const INPUT: CSSProperties = {
  width:      '100%',
  padding:    '8px 12px',
  background: '#1e1e1e',
  border:     '1px solid #3c3c3c',
  color:      '#d4d4d4',
  fontSize:   '13px',
  fontFamily: "'Inter', sans-serif",
  outline:    'none',
};

/* ── Section wrapper ──────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        background:   '#141414',
        border:       '1px solid #2a2a2a',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          padding:      '12px 20px',
          borderBottom: '1px solid #2a2a2a',
          background:   '#1a1a1a',
        }}
      >
        <span
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '11px',
            color:         '#9ca3af',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

/* ── Field row ────────────────────────────────────────────────────── */
function FieldRow({
  label,
  hint,
  children,
}: {
  label:    string;
  hint?:    string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display:             'grid',
        gridTemplateColumns: '200px 1fr',
        gap:                 '16px',
        alignItems:          'start',
        padding:             '12px 0',
        borderBottom:        '1px solid #2a2a2a',
      }}
    >
      <div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '13px',
            color:      '#d4d4d4',
            marginBottom: hint ? '3px' : '0',
          }}
        >
          {label}
        </p>
        {hint && (
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize:   '11px',
              color:      '#4b5563',
              lineHeight: 1.4,
            }}
          >
            {hint}
          </p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ── Square toggle (Unity-style) ──────────────────────────────────── */
function Toggle({
  value,
  onChange,
  label,
}: {
  value:    boolean;
  onChange: (v: boolean) => void;
  label:    string;
}) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex items-center gap-2"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <span
        style={{
          display:    'inline-block',
          width:      '32px',
          height:     '16px',
          background: value ? '#569cd6' : '#3c3c3c',
          border:     '1px solid #5c5c5c',
          position:   'relative',
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position:   'absolute',
            top:        '1px',
            left:       value ? '15px' : '1px',
            width:      '12px',
            height:     '12px',
            background: '#d4d4d4',
            transition: 'left 0.15s',
          }}
        />
      </span>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize:   '13px',
          color:      value ? '#d4d4d4' : '#6b7280',
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function FormSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: formId } = use(params);

  const formQuery = trpc.forms.byId.useQuery({ id: formId });
  const form = formQuery.data?.data;

  /* ── Local form state ────────────────────────────────────────── */
  const [title,           setTitle]           = useState('');
  const [description,     setDescription]     = useState('');
  const [slug,            setSlug]            = useState('');
  const [theme,           setTheme]           = useState('default');
  const [visibility,      setVisibility]      = useState<'public' | 'unlisted'>('unlisted');
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [notifyCreator,   setNotifyCreator]   = useState(true);
  const [thankYouTitle,   setThankYouTitle]   = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [maxResponses,    setMaxResponses]    = useState('');
  const [expiresAt,       setExpiresAt]       = useState('');
  const [isDirty,         setIsDirty]         = useState(false);

  /* Hydrate from server data once */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (form && !hydrated) {
      setTitle(form.title ?? '');
      setDescription(form.description ?? '');
      setSlug((form.slug ?? '').toLowerCase());
      setTheme(form.theme ?? 'default');
      setVisibility((form.visibility as 'public' | 'unlisted') ?? 'unlisted');
      setShowProgressBar(form.showProgressBar ?? true);
      setNotifyCreator(form.notifyCreator ?? true);
      setThankYouTitle(form.thankYouTitle ?? '');
      setThankYouMessage(form.thankYouMessage ?? '');
      setMaxResponses(form.maxResponses != null ? String(form.maxResponses) : '');
      setExpiresAt(
        form.expiresAt
          ? new Date(form.expiresAt).toISOString().slice(0, 16)
          : ''
      );
      setHydrated(true);
    }
  }, [form, hydrated]);

  /* Mark dirty on any change */
  function markDirty() { setIsDirty(true); }

  /* ── Update mutation ─────────────────────────────────────────── */
  const utils = trpc.useUtils();
  const updateMutation = trpc.forms.update.useMutation({
    onSuccess: () => {
      setIsDirty(false);
      void utils.forms.byId.invalidate({ id: formId });
      toast.success('Settings saved.');
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSave() {
    updateMutation.mutate({
      id:             formId,
      title:          title          || undefined,
      description:    description    || undefined,
      slug:           slug.length >= 3 ? slug.toLowerCase() : undefined,
      theme:          theme          as typeof FORM_THEMES[number],
      visibility,
      showProgressBar,
      notifyCreator,
      thankYouTitle:   thankYouTitle  || undefined,
      thankYouMessage: thankYouMessage || undefined,
      maxResponses:    maxResponses   ? parseInt(maxResponses, 10) : undefined,
      expiresAt:       expiresAt      ? new Date(expiresAt).toISOString() : undefined,
    });
  }

  /* ── 4-state pattern ─────────────────────────────────────────── */
  if (formQuery.error) {
    return (
      <div
        className="flex items-center gap-2"
        style={{ padding: '24px', color: '#ef4444', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}
      >
        <AlertCircle size={14} />
        {formQuery.error.message}
      </div>
    );
  }

  if (!form) return null;

  const showLoading = useDelayedLoading(formQuery.isLoading);

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <AnimatePresence mode="wait">
      {showLoading ? (
        <div key="loading" style={{ padding: '24px' }}>
          <LoadingScreen variant="inline" message="Loading settings..." />
        </div>
      ) : (
        <div key="content" style={{ padding: '24px', maxWidth: '800px' }}>

      {/* ── Basic info ───────────────────────────────────────────── */}
      <Section title="Basic Info">
        <FieldRow label="Form Title" hint="Displayed at the top of your published form.">
          <input
            style={INPUT}
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = '#3c3c3c')}
            placeholder="My Form"
          />
        </FieldRow>

        <FieldRow label="Description" hint="Optional subtitle shown below the title.">
          <textarea
            style={{ ...INPUT, minHeight: '80px', resize: 'vertical' }}
            value={description}
            onChange={(e) => { setDescription(e.target.value); markDirty(); }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = '#3c3c3c')}
            placeholder="What this form is about..."
          />
        </FieldRow>

        <FieldRow label="URL Slug" hint="formforge.tech/f/[slug] — lowercase letters, numbers, hyphens only.">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <span
              style={{
                padding:    '8px 10px',
                background: '#252526',
                border:     '1px solid #3c3c3c',
                borderRight:'none',
                color:      '#4b5563',
                fontSize:   '12px',
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'nowrap',
              }}
            >
              /f/
            </span>
            <input
              style={{ ...INPUT, flex: 1 }}
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                markDirty();
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = '#3c3c3c')}
              placeholder="my-form"
            />
          </div>
        </FieldRow>
      </Section>

      {/* ── Appearance ───────────────────────────────────────────── */}
      <Section title="Appearance">
        <FieldRow label="Theme" hint="Visual style applied to your public form.">
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap:                 '8px',
            }}
          >
            {FORM_THEMES.map((t) => {
              const meta = THEME_META[t] ?? THEME_META['default']!;
              const selected = theme === t;
              return (
                <button
                  key={t}
                  onClick={() => { setTheme(t); markDirty(); }}
                  style={{
                    padding:    '7px 12px',
                    background: selected ? meta.bg : '#1e1e1e',
                    border:     `1px solid ${selected ? meta.color : '#3c3c3c'}`,
                    color:      selected ? meta.color : '#9ca3af',
                    fontSize:   '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor:     'pointer',
                    textAlign:  'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = meta.color;
                      (e.currentTarget as HTMLButtonElement).style.color = meta.color;
                      (e.currentTarget as HTMLButtonElement).style.background = meta.bg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#3c3c3c';
                      (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
                      (e.currentTarget as HTMLButtonElement).style.background = '#1e1e1e';
                    }
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </FieldRow>

        <FieldRow label="Visibility" hint="Public forms appear on the Explore page.">
          <div className="flex gap-2">
            {(['public', 'unlisted'] as const).map((v) => (
              <button
                key={v}
                onClick={() => { setVisibility(v); markDirty(); }}
                style={{
                  padding:    '7px 20px',
                  background: visibility === v ? '#569cd6' : 'transparent',
                  border:     `1px solid ${visibility === v ? '#569cd6' : '#3c3c3c'}`,
                  color:      visibility === v ? '#0e0e0e' : '#9ca3af',
                  fontSize:   '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: visibility === v ? 700 : 400,
                  cursor:     'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </FieldRow>
      </Section>

      {/* ── Behaviour ────────────────────────────────────────────── */}
      <Section title="Behaviour">
        <FieldRow label="Progress Bar" hint="Show respondents how far through the form they are.">
          <Toggle
            value={showProgressBar}
            onChange={(v) => { setShowProgressBar(v); markDirty(); }}
            label={showProgressBar ? 'Enabled' : 'Disabled'}
          />
        </FieldRow>

        <FieldRow label="Email Notifications" hint="Get an email when someone submits a response.">
          <Toggle
            value={notifyCreator}
            onChange={(v) => { setNotifyCreator(v); markDirty(); }}
            label={notifyCreator ? 'Enabled' : 'Disabled'}
          />
        </FieldRow>

        <FieldRow label="Max Responses" hint="Automatically close the form after this many responses. Leave blank for unlimited.">
          <input
            type="number"
            style={{ ...INPUT, maxWidth: '160px' }}
            value={maxResponses}
            min={1}
            onChange={(e) => { setMaxResponses(e.target.value); markDirty(); }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = '#3c3c3c')}
            placeholder="Unlimited"
          />
        </FieldRow>

        <FieldRow label="Expiry Date" hint="Form stops accepting responses after this date and time.">
          <input
            type="datetime-local"
            style={{ ...INPUT, maxWidth: '240px' }}
            value={expiresAt}
            onChange={(e) => { setExpiresAt(e.target.value); markDirty(); }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = '#3c3c3c')}
          />
        </FieldRow>
      </Section>

      {/* ── Thank You Screen ─────────────────────────────────────── */}
      <Section title="Thank You Screen">
        <FieldRow label="Headline" hint="Shown after a successful submission.">
          <input
            style={INPUT}
            value={thankYouTitle}
            onChange={(e) => { setThankYouTitle(e.target.value); markDirty(); }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = '#3c3c3c')}
            placeholder="Thank you!"
          />
        </FieldRow>

        <FieldRow label="Message" hint="Supporting text below the headline.">
          <textarea
            style={{ ...INPUT, minHeight: '80px', resize: 'vertical' }}
            value={thankYouMessage}
            onChange={(e) => { setThankYouMessage(e.target.value); markDirty(); }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#569cd6')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = '#3c3c3c')}
            placeholder="Your response has been recorded."
          />
        </FieldRow>
      </Section>

      {/* ── Save bar ─────────────────────────────────────────────── */}
      <div
        style={{
          position:       'sticky',
          bottom:         0,
          background:     '#1e1e1e',
          borderTop:      '1px solid #2a2a2a',
          padding:        '12px 0',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            '12px',
        }}
      >
        {isDirty ? (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   '11px',
              color:      '#ff9800',
            }}
          >
            ● Unsaved changes
          </span>
        ) : (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   '11px',
              color:      '#4b5563',
            }}
          >
            All changes saved
          </span>
        )}

        <button
          onClick={handleSave}
          disabled={!isDirty || updateMutation.isPending}
          className="flex items-center gap-2"
          style={{
            fontFamily:  "'JetBrains Mono', monospace",
            fontSize:    '12px',
            fontWeight:  700,
            letterSpacing:'0.06em',
            color:       !isDirty || updateMutation.isPending ? '#4b5563' : '#0e0e0e',
            background:  !isDirty || updateMutation.isPending ? '#2a2a2a' : '#569cd6',
            border:      '1px solid #569cd6',
            padding:     '7px 20px',
            cursor:      !isDirty || updateMutation.isPending ? 'not-allowed' : 'pointer',
            transition:  'all 0.15s',
          }}
        >
          <Save size={12} />
          {updateMutation.isPending ? 'SAVING...' : 'SAVE SETTINGS'}
        </button>
      </div>
        </div>
      )}
    </AnimatePresence>
  );
}
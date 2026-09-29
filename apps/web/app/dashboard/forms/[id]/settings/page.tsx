'use client';

import { use, useState, useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { trpc } from '~/trpc/client';
import { FORM_THEMES, THEME_META } from '@repo/shared';
import type { DraftContent } from '@repo/shared';
import { Save, AlertCircle } from 'lucide-react';
import LoadingScreen from '~/components/shared/LoadingScreen';
import { useDelayedLoading } from '~/lib/hooks/useDelayedLoading';
import { toast } from 'sonner';
import { useDraft } from '~/lib/draft/useDraft';
import type { SaveStatus } from '~/lib/draft/saveController';

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

/* ── Draft helper text ────────────────────────────────────────────── */
/** One muted line under a section that edits draft content. */
function DraftNote() {
  return (
    <p
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize:   '11px',
        color:      '#4b5563',
        lineHeight: 1.4,
        marginTop:  '12px',
      }}
    >
      Changes here go live when you publish.
    </p>
  );
}

/** The five content fields this page edits, as the form inputs hold them. */
interface SettingsContent {
  title:           string;
  description:     string;
  theme:           string;
  thankYouTitle:   string;
  thankYouMessage: string;
}

/** Turns a draft's content into the strings the inputs hold (null becomes ''). */
function toSettingsContent(c: DraftContent): SettingsContent {
  return {
    title:           c.title,
    description:     c.description ?? '',
    theme:           c.theme,
    thankYouTitle:   c.thankYouTitle ?? '',
    thankYouMessage: c.thankYouMessage ?? '',
  };
}

/** Shown when a draft save did not finish and the hook has no message of its own. */
const SAVE_FALLBACK: Partial<Record<SaveStatus, string>> = {
  conflict: 'This form was changed in another tab. Reload to see the latest.',
  offline:  "You're offline. Your changes are kept here and will save when you reconnect.",
};

/* ── Page ─────────────────────────────────────────────────────────── */
export default function FormSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: formId } = use(params);

  const formQuery = trpc.forms.byId.useQuery({ id: formId });
  const form = formQuery.data?.data;

  // Title, description, theme and the thank-you screen live in the draft;
  // forms.update only takes the operational settings.
  const draft = useDraft(formId);
  // The latest hook state, for reading after an await (a closure would be stale).
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  // The content values last known to be in the draft. Only inputs that differ
  // from this are written back, so an untouched field can never overwrite a
  // newer edit made elsewhere.
  const savedContentRef = useRef<SettingsContent | null>(null);

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

  /* Hydrate once, when both the form and its draft have loaded. */
  const [hydrated, setHydrated] = useState(false);
  const draftContent = draft.content;
  useEffect(() => {
    if (form && draftContent && !hydrated) {
      const content = toSettingsContent(draftContent);
      savedContentRef.current = content;
      setTitle(content.title);
      setDescription(content.description);
      setSlug((form.slug ?? '').toLowerCase());
      setTheme(content.theme);
      setVisibility((form.visibility as 'public' | 'unlisted') ?? 'unlisted');
      setShowProgressBar(form.showProgressBar ?? true);
      setNotifyCreator(form.notifyCreator ?? true);
      setThankYouTitle(content.thankYouTitle);
      setThankYouMessage(content.thankYouMessage);
      setMaxResponses(form.maxResponses != null ? String(form.maxResponses) : '');
      setExpiresAt(
        form.expiresAt
          ? new Date(form.expiresAt).toISOString().slice(0, 16)
          : ''
      );
      setHydrated(true);
    }
  }, [form, draftContent, hydrated]);

  /* Mark dirty on any change */
  function markDirty() { setIsDirty(true); }

  /* ── Update mutation ─────────────────────────────────────────── */
  const utils = trpc.useUtils();
  const updateMutation = trpc.forms.update.useMutation({
    onSuccess: () => {
      setIsDirty(false);
      void utils.forms.byId.invalidate({ id: formId });
      void utils.forms.myForms.invalidate();
      toast.success('Settings saved.');
    },
    onError: (err) => toast.error(err.message),
  });

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const saveBusy = isSavingDraft || updateMutation.isPending;

  /** Saves the draft content first, then the operational settings. */
  async function handleSave() {
    if (saveBusy) return;
    const base = savedContentRef.current;
    if (!base) return; // not hydrated yet: nothing on screen to save
    const edited: SettingsContent = { title, description, theme, thankYouTitle, thankYouMessage };
    const changed = (Object.keys(edited) as (keyof SettingsContent)[])
      .some((key) => edited[key] !== base[key]);

    if (changed) {
      // Only the inputs the user changed go into the draft, so an untouched
      // field never overwrites the draft's current value.
      draft.update((c) => ({
        ...c,
        ...(edited.title !== base.title ? { title: edited.title } : {}),
        ...(edited.description !== base.description
          ? { description: edited.description || null } : {}),
        ...(edited.theme !== base.theme
          ? { theme: edited.theme as DraftContent['theme'] } : {}),
        ...(edited.thankYouTitle !== base.thankYouTitle
          ? { thankYouTitle: edited.thankYouTitle || null } : {}),
        ...(edited.thankYouMessage !== base.thankYouMessage
          ? { thankYouMessage: edited.thankYouMessage || null } : {}),
      }));
      setIsSavingDraft(true);
      let flushed: SaveStatus;
      try {
        flushed = await draft.flushNow();
      } finally {
        setIsSavingDraft(false);
      }
      if (flushed !== 'saved') {
        toast.error(draftRef.current.statusMessage ?? SAVE_FALLBACK[flushed] ?? "Couldn't save.");
        return;
      }
      savedContentRef.current = edited;
    }

    updateMutation.mutate({
      id:             formId,
      slug:           slug.length >= 3 ? slug.toLowerCase() : undefined,
      visibility,
      showProgressBar,
      notifyCreator,
      maxResponses:    maxResponses   ? parseInt(maxResponses, 10) : undefined,
      expiresAt:       expiresAt      ? new Date(expiresAt).toISOString() : undefined,
    });
  }

  // A draft that has not arrived yet, without an error, is still loading, not missing.
  const loading = formQuery.isLoading || draft.isLoading || (draft.content === null && !draft.error);
  const showLoading = useDelayedLoading(loading);

  /* ── 4-state pattern: loading, error, empty, success ─────────── */
  if (loading) {
    if (!showLoading) return null;
    return (
      <div style={{ padding: '24px' }}>
        <LoadingScreen variant="inline" message="Loading settings..." />
      </div>
    );
  }

  const loadError = formQuery.error?.message ?? (draft.content === null ? draft.error : null);
  if (loadError) {
    return (
      <div
        className="flex items-center gap-2"
        style={{ padding: '24px', color: '#ef4444', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}
      >
        <AlertCircle size={14} />
        {loadError}
      </div>
    );
  }

  if (!form || !draft.content) {
    return (
      <div
        style={{
          padding:    '24px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize:   '12px',
          color:      '#4b5563',
        }}
      >
        Form not found in scene.
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>

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

        <FieldRow label="URL Slug" hint="formforge.jdevs.codes/f/[slug] — lowercase letters, numbers, hyphens only.">
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
        <DraftNote />
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
        <DraftNote />

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
        <DraftNote />
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
          disabled={!isDirty || saveBusy}
          className="flex items-center gap-2"
          style={{
            fontFamily:  "'JetBrains Mono', monospace",
            fontSize:    '12px',
            fontWeight:  700,
            letterSpacing:'0.06em',
            color:       !isDirty || saveBusy ? '#4b5563' : '#0e0e0e',
            background:  !isDirty || saveBusy ? '#2a2a2a' : '#569cd6',
            border:      '1px solid #569cd6',
            padding:     '7px 20px',
            cursor:      !isDirty || saveBusy ? 'not-allowed' : 'pointer',
            transition:  'all 0.15s',
          }}
        >
          <Save size={12} />
          {saveBusy ? 'SAVING...' : 'SAVE SETTINGS'}
        </button>
      </div>
    </div>
  );
}
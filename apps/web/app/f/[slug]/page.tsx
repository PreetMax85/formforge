import { notFound } from 'next/navigation';
import { FormRenderer } from '~/components/form/FormRenderer';
import { ThemeBackground } from '~/components/shared/ThemeBackground';
import type { Field } from '~/lib/types/field';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface PublicFormPageProps {
  params: { slug: string };
}

/**
 * Public form page — no auth required.
 * Server component: fetches form + fields, injects theme, increments view count.
 * Renders FormRenderer in mode='live'.
 */
export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { slug } = await params;

  /* ── Fetch form + fields from backend ───────────────────────────── */
  let form: FormWithFields | null = null;

  const res = await fetch(`${API_URL}/api/v1/forms/${slug}`, { cache: 'no-store' });

  if (res.status === 404) notFound();

  try {
    if (!res.ok) {
      const body = (await res.json()) as ApiErrorEnvelope;
      throw new Error(getApiErrorMessage(body));
    }

    const body = (await res.json()) as ApiEnvelope<FormWithFields>;
    form = body.data;
  } catch (err) {
    if (err instanceof Error && 'digest' in err) throw err;
    const message = err instanceof Error ? err.message : 'Something went wrong';
    return <FormUnavailable message={message} />;
  }

  if (!form) notFound();

  /* ── Status gate (mirrors responses.service.ts Step 2) ─────────── */
  if (form.status !== 'published') {
    return <FormUnavailable message="This form is not available." />;
  }
  if (form.expiresAt && new Date(form.expiresAt) < new Date()) {
    return <FormUnavailable message="This form has closed." />;
  }
  if (form.maxResponses != null && form.responseCount >= form.maxResponses) {
    return <FormUnavailable message="This form is no longer accepting responses." />;
  }

  /* ── Fire-and-forget view count increment ───────────────────────── */
  void fetch(`${API_URL}/api/v1/forms/${slug}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({}),
    cache:  'no-store',
  }).catch(() => {
    // Non-critical — silently ignore failures
  });

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div
      data-theme={form.theme}
      className="min-h-screen"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Ambient background effect for all themed forms */}
      {(form.theme === 'matrix' ||
        form.theme === 'jujutsu-kaisen' ||
        form.theme === 'ghost-of-tsushima' ||
        form.theme === 'karan-aujla-concert') && (
        <ThemeBackground theme={form.theme} />
      )}

      <FormRenderer
        formConfig={{
          id:              form.id,
          slug:            form.slug,
          title:           form.title,
          description:     form.description,
          theme:           form.theme,
          showProgressBar: form.showProgressBar,
          requireEmail:    form.requireEmail,
          allowAnonymous:  form.allowAnonymous,
          thankYouTitle:   form.thankYouTitle,
          thankYouMessage: form.thankYouMessage,
          fields:          form.fields as unknown as Field[],
        }}
        mode="live"
      />
    </div>
  );
}

/* ── Types ────────────────────────────────────────────────────────── */
interface FormField {
  id:          string;
  formId:      string;
  type:        string;
  label:       string;
  placeholder: string | null;
  description: string | null;
  required:    boolean;
  order:       number;
  config:      Record<string, unknown>;
  conditions:  unknown;
  createdAt:   string;
  updatedAt:   string;
}

interface FormWithFields {
  id:              string;
  slug:            string;
  title:           string;
  description:     string | null;
  theme:           string;
  status:          string;
  visibility:      string;
  showProgressBar: boolean;
  requireEmail:    boolean;
  allowAnonymous:  boolean;
  notifyCreator:   boolean;
  thankYouTitle:   string | null;
  thankYouMessage: string | null;
  maxResponses:    number | null;
  expiresAt:       string | null;
  responseCount:   number;
  viewCount:       number;
  publishedAt:     string | null;
  createdAt:       string;
  updatedAt:       string;
  fields:          FormField[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data:    T;
}

interface ApiErrorEnvelope {
  error?:   string;
  message?: string;
  code?:    string;
}

function getApiErrorMessage(body: ApiErrorEnvelope): string {
  return body.error ?? body.message ?? body.code ?? 'Failed to load form';
}

/* ── Unavailable state ────────────────────────────────────────────── */
function FormUnavailable({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ background: '#1e1e1e' }}
    >
      <p
        style={{
          fontSize:   '14px',
          color:      '#9ca3af',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {message}
      </p>
    </div>
  );
}

/**
 * Generates public form page metadata from the fetched form.
 */
export async function generateMetadata({ params }: PublicFormPageProps) {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/api/v1/forms/${slug}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Form | FormForge' };
    const body = (await res.json()) as ApiEnvelope<{ title: string; description: string | null }>;
    return {
      title:       `${body.data.title} | FormForge`,
      description: body.data.description ?? 'Fill out this form on FormForge.',
    };
  } catch {
    return { title: 'Form | FormForge' };
  }
}

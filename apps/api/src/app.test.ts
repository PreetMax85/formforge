import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

// The database is replaced with a stub so these tests exercise the real
// Express app, tRPC router and OpenAPI adapter without a Postgres connection.
vi.mock('./common/db/index', () => ({
  db:      { execute: vi.fn() },
  closeDb: vi.fn(),
}));

vi.mock('./modules/forms/forms.service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./modules/forms/forms.service')>()),
  getFormBySlug: vi.fn(),
  exploreForms:  vi.fn(),
}));

const { createApp }                   = await import('./app');
const { db }                          = await import('./common/db/index');
const { getFormBySlug, exploreForms } = await import('./modules/forms/forms.service');
const { ApiError }                    = await import('@repo/shared');
const { logger }                      = await import('./common/logger');

const now = new Date('2026-09-01T00:00:00.000Z');

/** A form row exactly as Drizzle returns it, including columns that must never leave the server. */
const seededForm = {
  id:              '00000000-0000-4000-8000-000000000001',
  creatorId:       '00000000-0000-4000-8000-000000000002',
  title:           'The Samurai Oath',
  description:     'A form',
  slug:            'samurai-oath',
  status:          'published' as const,
  visibility:      'public' as const,
  theme:           'ghost-of-tsushima',
  allowAnonymous:  true,
  requireEmail:    false,
  showProgressBar: true,
  notifyCreator:   true,
  responseCount:   250,
  viewCount:       400,
  thankYouTitle:   'Thank you!',
  thankYouMessage: 'Recorded.',
  maxResponses:    null,
  expiresAt:       null,
  passwordHash:    '$2b$12$secret-hash-that-must-not-leak',
  publishedAt:     now,
  createdAt:       now,
  updatedAt:       now,
};

const seededField = {
  id:          '00000000-0000-4000-8000-000000000003',
  formId:      seededForm.id,
  type:        'single_select' as const,
  label:       'Choose your path',
  placeholder: null,
  description: 'Pick one',
  required:    true,
  order:       0,
  config:      { options: ['Honor', 'Ghost'] },
  retiredAt:   null,
  conditions:  { action: 'show', logicType: 'all', rules: [] },
  createdAt:   now,
  updatedAt:   now,
};

/** Every form property read by apps/web/app/f/[slug]/page.tsx and FormRenderer. */
const FORM_KEYS_THE_PUBLIC_PAGE_READS = [
  'id', 'slug', 'title', 'description', 'theme', 'status', 'expiresAt',
  'maxResponses', 'responseCount', 'showProgressBar', 'requireEmail',
  'allowAnonymous', 'thankYouTitle', 'thankYouMessage', 'fields',
];

/** Every field property read by FormRenderer, FormField, and the shared validators. */
const FIELD_KEYS_THE_RENDERER_READS = [
  'id', 'type', 'label', 'placeholder', 'description', 'required', 'order',
  'config', 'conditions',
];

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  vi.mocked(db.execute).mockReset();
});

describe('createApp', () => {
  it('serves an OpenAPI document listing only the public endpoints', async () => {
    const res = await fetch(`${baseUrl}/openapi.json`);
    const doc = (await res.json()) as { paths: Record<string, Record<string, unknown>> };

    const operations = Object.entries(doc.paths).flatMap(([path, methods]) =>
      Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`),
    );
    expect(operations.sort()).toEqual([
      'GET /forms',
      'GET /forms/{slug}',
      'POST /forms/{slug}/view',
      'POST /responses/submit',
    ]);
  });
});

describe('GET /api/v1/forms/{slug}', () => {
  it('returns every property the public form page needs', async () => {
    vi.mocked(getFormBySlug).mockResolvedValue({ ...seededForm, fields: [seededField] });

    const res  = await fetch(`${baseUrl}/api/v1/forms/samurai-oath`);
    const body = (await res.json()) as { success: boolean; data: Record<string, unknown> };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    for (const key of FORM_KEYS_THE_PUBLIC_PAGE_READS) {
      expect(body.data, `form.${key}`).toHaveProperty(key);
    }
    const [field] = body.data.fields as Record<string, unknown>[];
    for (const key of FIELD_KEYS_THE_RENDERER_READS) {
      expect(field, `field.${key}`).toHaveProperty(key);
    }
    expect(field?.config).toEqual(seededField.config);
    expect(field?.conditions).toEqual(seededField.conditions);
  });

  it('answers 404 for an unknown slug, over REST and tRPC', async () => {
    vi.mocked(getFormBySlug).mockRejectedValue(ApiError.notFound('Form not found'));

    const rest = await fetch(`${baseUrl}/api/v1/forms/no-such-form`);
    const trpc = await fetch(`${baseUrl}/trpc/forms.bySlug?input=${encodeURIComponent(JSON.stringify({ slug: 'no-such-form' }))}`);

    expect(rest.status).toBe(404);
    expect(trpc.status).toBe(404);
    expect(JSON.stringify(await trpc.json())).toContain('Form not found');
  });

  it('never exposes the form password hash', async () => {
    vi.mocked(getFormBySlug).mockResolvedValue({ ...seededForm, fields: [seededField] });

    const res  = await fetch(`${baseUrl}/api/v1/forms/samurai-oath`);
    const body = (await res.json()) as { data: Record<string, unknown> };

    expect(body.data).not.toHaveProperty('passwordHash');
  });
});

describe('tRPC error logging', () => {
  const bySlug = (slug: string) =>
    fetch(`${baseUrl}/trpc/forms.bySlug?input=${encodeURIComponent(JSON.stringify({ slug }))}`);

  it('logs an unexpected failure with its path and cause', async () => {
    const boom = new Error('connection terminated unexpectedly');
    vi.mocked(getFormBySlug).mockRejectedValue(boom);
    const logged = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    const res = await bySlug('samurai-oath');

    expect(res.status).toBe(500);
    expect(logged).toHaveBeenCalledWith({ path: 'forms.bySlug', err: boom }, expect.any(String));
    logged.mockRestore();
  });

  it('does not log a 4xx as an error', async () => {
    vi.mocked(getFormBySlug).mockRejectedValue(ApiError.notFound('Form not found'));
    const logged = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    const res = await bySlug('no-such-form');

    expect(res.status).toBe(404);
    expect(logged).not.toHaveBeenCalled();
    logged.mockRestore();
  });
});

describe('GET /api/v1/forms', () => {
  it('lists public forms without being captured by the {slug} route', async () => {
    vi.mocked(exploreForms).mockResolvedValue({ items: [seededForm], nextCursor: null });

    const res  = await fetch(`${baseUrl}/api/v1/forms?limit=10`);
    const body = (await res.json()) as { data: { items: unknown[]; nextCursor: string | null } };

    expect(res.status).toBe(200);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.nextCursor).toBeNull();
  });

  it('never exposes the form password hash', async () => {
    vi.mocked(exploreForms).mockResolvedValue({ items: [seededForm], nextCursor: null });

    const res  = await fetch(`${baseUrl}/api/v1/forms?limit=10`);
    const body = (await res.json()) as { data: { items: Record<string, unknown>[] } };

    expect(res.status).toBe(200);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]).not.toHaveProperty('passwordHash');
  });
});

describe('GET /health', () => {
  it('answers without querying the database', async () => {
    const res = await fetch(`${baseUrl}/health`);

    expect(res.status).toBe(200);
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('checks the database when asked for a deep check', async () => {
    vi.mocked(db.execute).mockResolvedValue({} as never);

    const res  = await fetch(`${baseUrl}/health?deep=1`);
    const body = (await res.json()) as { db: string };

    expect(res.status).toBe(200);
    expect(body.db).toBe('connected');
    expect(db.execute).toHaveBeenCalledOnce();
  });

  it('reports 503 from the deep check when the database is unreachable', async () => {
    vi.mocked(db.execute).mockRejectedValue(new Error('connect ECONNREFUSED'));

    const res  = await fetch(`${baseUrl}/health?deep=1`);
    const body = (await res.json()) as { db: string };

    expect(res.status).toBe(503);
    expect(body.db).toBe('disconnected');
  });
});

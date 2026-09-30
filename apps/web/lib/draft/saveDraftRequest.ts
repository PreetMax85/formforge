import * as Sentry from '@sentry/nextjs';
import type { DraftContent } from '@repo/shared';
import { API_URL } from '~/lib/api-url';
import { getAccessToken, initAuth } from '~/lib/auth';
import type { SaveOutcome } from './saveController';

// Browsers cap keepalive request bodies at 64 KiB in total (all in-flight
// keepalive requests together), so stay under it with room to spare.
const KEEPALIVE_LIMIT = 60_000;

const SIGNED_OUT = 'Signed out. Log in again to keep saving.';
// Shown for a 400. The server's own message is tRPC's raw Zod issue list
// (JSON), which means nothing to a creator; it goes to Sentry instead.
const REJECTED = "Couldn't save. Undo your last change and try again.";

/** What is known about a save the server refused as invalid. */
export interface RejectedSaveReport {
  formId: string;
  baseRevision: number;
  status: number;
  serverMessage: string | null;
}

interface Deps {
  fetchImpl?: typeof fetch;
  refresh?: () => Promise<boolean>;
  token?: () => string | null;
  report?: (rejected: RejectedSaveReport) => void;
}

/** Sends a refused save to Sentry: the builder let through input the schema rejects. */
function reportToSentry(rejected: RejectedSaveReport): void {
  Sentry.captureMessage('Draft save rejected', { level: 'warning', extra: { ...rejected } });
}

/**
 * Sends one autosave straight to the tRPC endpoint (not through React Query)
 * with keepalive, so a save started as the tab closes still arrives. Refreshes
 * an expired access token once before giving up. Never throws: a failed
 * request or a 5xx is reported as `network` so the controller retries it.
 * A 400 is rejected with fixed text and its server message is reported.
 */
export async function saveDraftRequest(
  formId: string,
  content: DraftContent,
  baseRevision: number,
  deps: Deps = {},
): Promise<SaveOutcome> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const refresh = deps.refresh ?? initAuth;
  const token = deps.token ?? getAccessToken;
  const report = deps.report ?? reportToSentry;
  const body = JSON.stringify({ formId, baseRevision, content });
  const keepalive = new TextEncoder().encode(body).byteLength <= KEEPALIVE_LIMIT;

  const send = (): Promise<Response> => {
    const t = token();
    return fetchImpl(`${API_URL}/trpc/drafts.save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body,
      credentials: 'include',
      keepalive,
    });
  };

  try {
    let res = await send();
    if (res.status === 401) {
      if (!(await refresh())) return { kind: 'rejected', message: SIGNED_OUT };
      res = await send();
      if (res.status === 401) return { kind: 'rejected', message: SIGNED_OUT };
    }
    if (res.status === 409) return { kind: 'conflict' };
    // 429 (rate limited) is transient like a 5xx: back off and retry. Its
    // body is { success: false, error: string }, not a tRPC error shape.
    if (res.status === 429 || res.status >= 500) return { kind: 'network' };
    const payload = (await res.json()) as {
      result?: { data?: { data?: { revision?: number } } };
      error?: { message?: string };
    };
    if (res.ok) {
      const revision = payload.result?.data?.data?.revision;
      return typeof revision === 'number' ? { kind: 'saved', revision } : { kind: 'network' };
    }
    if (res.status === 400) {
      try {
        report({ formId, baseRevision, status: res.status, serverMessage: payload.error?.message ?? null });
      } catch {
        // Reporting must never change what the creator sees.
      }
      return { kind: 'rejected', message: REJECTED };
    }
    return { kind: 'rejected', message: payload.error?.message ?? "Couldn't save." };
  } catch {
    return { kind: 'network' };
  }
}

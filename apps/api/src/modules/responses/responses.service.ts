import { createHash } from 'crypto';
import bcrypt from 'bcrypt';
import { sql, eq, and, desc, lt, inArray, isNull, or, type SQL } from 'drizzle-orm';
import { db } from '../../common/db/index';
import { forms, fields, responses, responseAnswers } from '@repo/db/schema';
import { ApiError, resolveVisibleFieldGraph, validateResponseAnswers } from '@repo/shared';
import { logger } from '../../common/logger';
import { env } from '../../common/config/env';
import { detectSpamSubmissionCluster } from '../analytics/analytics.service';
import { sendResponseReceived, sendResponseCopy } from '@repo/email';

// Re-export for backward compatibility — tests import from this module
export { validateResponseAnswers } from '@repo/shared';

interface SubmitResponseInput {
  formSlug:        string;
  answers:         { fieldId: string; value: string | string[] }[];
  respondentEmail?: string;
  respondentName?:  string;
  sendEmailCopy:    boolean;
  ipAddress?:       string;
  userAgent?:       string;
  turnstileToken?:  string;
  password?:        string;
  _hp?:             string;
}

export async function submitResponse(input: SubmitResponseInput) {
  // Multi-Strategy Identity Resolution Pipeline:
  // 1. Zod Payload Integrity Verification
  // 2. Finite State Machine Gate (Ensure form is PUBLISHED)
  // 3. Cryptographic Session Token Verification
  // 4. IP/UA Fingerprint Fallback with Distributed Mutex Lock
  // 5. Transactional Relational Integrity Check

  // Step 1: Zod handled upstream by tRPC SubmitResponseSchema

  // Honeypot check — silent fake success
  if (input._hp && input._hp.length > 0) {
    return { success: true, message: 'Response submitted successfully.' };
  }

  // Step 2: Finite State Machine Gate
  const form = await db.query.forms.findFirst({
    where: eq(forms.slug, input.formSlug),
    with: {
      fields:  { orderBy: (f, { asc }) => [asc(f.order)] },
      creator: { columns: { email: true } },
    },
  });

  if (!form) throw ApiError.notFound('Form not found');
  if (form.status !== 'published') throw ApiError.forbidden('Form is not accepting responses');
  if (form.expiresAt && form.expiresAt < new Date()) throw ApiError.forbidden('This form has closed');

  // Enforce form-level access settings
  if (form.requireEmail && !input.respondentEmail) {
    throw ApiError.badRequest('Email is required for this form');
  }
  if (!form.allowAnonymous && !input.respondentEmail && !input.respondentName) {
    throw ApiError.badRequest('This form does not accept anonymous responses');
  }
  if (form.passwordHash && !(await bcrypt.compare(input.password ?? '', form.passwordHash))) {
    throw ApiError.unauthorized('Incorrect form password');
  }

  // Build answers map for conditional-logic resolution
  const answersMap: Record<string, string | string[]> = {};
  for (const a of input.answers) {
    answersMap[a.fieldId] = a.value;
  }

  // Resolve visible fields using conditional logic graph
  const visibleFields = resolveVisibleFieldGraph(
    form.fields.map(f => ({
      id: f.id,
      type: f.type,
      conditions: f.conditions as unknown | null,
    })),
    answersMap,
  );
  const visibleFieldIds = new Set(visibleFields.map(vf => vf.id));

  // Server-side field validation — only visible fields
  const validation = validateResponseAnswers(
    form.fields
      .filter(f => visibleFieldIds.has(f.id))
      .map(f => ({
        id: f.id, type: f.type, required: f.required,
        config: f.config as Record<string, unknown>, label: f.label,
      })),
    input.answers,
  );
  if (!validation.success) {
    throw ApiError.badRequest(validation.error ?? 'Validation failed');
  }

  // Step 3: Cryptographic Session Token Verification (Turnstile)
  if (env.TURNSTILE_ENABLED) {
    if (!env.TURNSTILE_SECRET_KEY) {
      logger.error('[TURNSTILE] Enabled but secret key not configured — failing closed');
      throw ApiError.internal('CAPTCHA verification is misconfigured');
    }
    const valid = await verifyTurnstileToken(input.turnstileToken);
    if (!valid) throw ApiError.badRequest('CAPTCHA verification failed');
  }

  // Spam cluster detection
  const spamCheck = await detectSpamSubmissionCluster(form.id, input);
  if (spamCheck.isSpam && spamCheck.confidence > 0.8) {
    logger.warn({ formId: form.id, reason: spamCheck.reason }, 'Spam cluster detected');
    return { success: true, message: 'Response submitted successfully.' };
  }

  // Step 4: IP/UA Fingerprint — Distributed Mutex Lock
  // Includes respondentEmail/Name to avoid false-positive duplicate rejection
  // when multiple users share the same NAT IP (corporate WiFi, VPN, school).
  const submissionHash = createHash('sha256')
    .update(`${input.ipAddress ?? ''}:${form.id}:${input.userAgent ?? ''}:${input.respondentEmail ?? ''}:${input.respondentName ?? ''}:${Math.floor(Date.now() / 30_000)}`)
    .digest('hex');

  const submissionHashExpiresAt = new Date(Date.now() + 30_000);

  // Step 5: Transactional Relational Integrity Check
  // maxResponses is enforced atomically inside the transaction via a
  // conditional UPDATE to prevent TOCTOU races between concurrent submissions.
  const result = await db.transaction(async (tx) => {
    const [response] = await tx
      .insert(responses)
      .values({
        formId:                  form.id,
        respondentEmail:         input.respondentEmail,
        respondentName:          input.respondentName,
        ipAddress:               input.ipAddress,
        userAgent:               input.userAgent,
        submissionHash,
        submissionHashExpiresAt,
        emailCopySent:           input.sendEmailCopy && !!input.respondentEmail,
      })
      .onConflictDoNothing({ target: responses.submissionHash })
      .returning();

    if (!response) return { duplicate: true, response: null, capReached: false };

    // Conditional atomic increment — only increments if under maxResponses cap.
    // This is race-safe: the WHERE clause is evaluated at UPDATE time.
    const [updated] = await tx
      .update(forms)
      .set({ responseCount: sql`${forms.responseCount} + 1` })
      .where(
        and(
          eq(forms.id, form.id),
          or(isNull(forms.maxResponses), lt(forms.responseCount, forms.maxResponses)),
        ),
      )
      .returning({ responseCount: forms.responseCount });

    if (!updated) {
      // Cap reached — undo the response insert within the same transaction
      await tx.delete(responses).where(eq(responses.id, response.id));
      return { duplicate: false, response: null, capReached: true };
    }

    if (input.answers.length > 0) {
      await tx.insert(responseAnswers).values(
        input.answers.map(a => ({
          responseId: response.id,
          fieldId:    a.fieldId,
          value: Array.isArray(a.value) ? a.value : String(a.value),
        }))
      );
    }

    return { duplicate: false, response, capReached: false };
  });

  if (result.capReached) {
    throw ApiError.forbidden('This form is no longer accepting responses');
  }

  if (result.duplicate) {
    return { success: true, message: 'Response already received.', duplicate: true };
  }

  // Dead Letter Queue (DLQ) pattern: email notifications dispatched
  // post-transaction to prevent blocking the critical submission path.
  // Failed notifications are logged via pino for manual retry.
  if (form.notifyCreator) {
    sendResponseReceived({
      formTitle:      form.title,
      creatorEmail:   form.creator.email,
      respondentName: input.respondentName,
      formUrl:        `${env.APP_URL}/dashboard/forms/${form.id}/responses`,
    }).catch((err: unknown) => {
      logger.error({ err, formId: form.id }, 'Creator notification email failed');
    });
  }

  const formattedAnswers = input.answers.map(a => ({
    label: form.fields.find(f => f.id === a.fieldId)?.label ?? a.fieldId,
    value: Array.isArray(a.value) ? a.value.join(', ') : a.value,
  }));

  if (input.sendEmailCopy && input.respondentEmail) {
    sendResponseCopy({
      formTitle:       form.title,
      respondentEmail: input.respondentEmail,
      answers:         formattedAnswers,
    }).catch((err: unknown) => {
      logger.error({ err }, 'Respondent copy email failed');
    });
  }

  return { success: true, response: result.response, duplicate: false };
}

export async function listResponses(
  formId: string,
  requesterId: string,
  opts: { limit: number; cursor?: string },
) {
  const [form] = await db.select({ creatorId: forms.creatorId }).from(forms).where(eq(forms.id, formId)).limit(1);
  if (!form) throw ApiError.notFound('Form not found');
  if (form.creatorId !== requesterId) throw ApiError.forbidden('Not your form');

  const conditions: SQL<unknown>[] = [eq(responses.formId, formId)];
  if (opts.cursor) {
    // Composite cursor: createdAt|id — ensures stable pagination with
    // ORDER BY createdAt DESC, id DESC (no skipped/duplicate rows)
    const sepIdx = opts.cursor.lastIndexOf('|');
    if (sepIdx > 0) {
      const cursorDate = opts.cursor.slice(0, sepIdx);
      const cursorId   = opts.cursor.slice(sepIdx + 1);
      const cursorCreatedAt = new Date(cursorDate);
      conditions.push(
        or(
          lt(responses.createdAt, cursorCreatedAt),
          and(eq(responses.createdAt, cursorCreatedAt), lt(responses.id, cursorId)),
        )!,
      );
    }
  }

  const rows = await db
    .select()
    .from(responses)
    .where(and(...conditions))
    .orderBy(desc(responses.createdAt), desc(responses.id))
    .limit(opts.limit + 1);

  const hasMore = rows.length > opts.limit;
  const trimmed = hasMore ? rows.slice(0, opts.limit) : rows;
  const last = trimmed[trimmed.length - 1];
  const nextCursor = hasMore && last ? `${last.createdAt.toISOString()}|${last.id}` : null;

  // Fetch answers for all returned responses
  const responseIds = trimmed.map(r => r.id);
  let answers: typeof responseAnswers.$inferSelect[] = [];
  if (responseIds.length > 0) {
    answers = await db
      .select()
      .from(responseAnswers)
      .where(inArray(responseAnswers.responseId, responseIds));
  }

  const fieldIds = [...new Set(answers.map(a => a.fieldId))];
  const fieldLabels = new Map<string, string>();
  if (fieldIds.length > 0) {
    const fieldRows = await db
      .select({ id: fields.id, label: fields.label })
      .from(fields)
      .where(inArray(fields.id, fieldIds));
    for (const f of fieldRows) fieldLabels.set(f.id, f.label);
  }

  const answersByResponseId = new Map<string, typeof responseAnswers.$inferSelect[]>();
  for (const answer of answers) {
    const existing = answersByResponseId.get(answer.responseId) ?? [];
    existing.push(answer);
    answersByResponseId.set(answer.responseId, existing);
  }

  const items = trimmed.map(r => ({
    ...r,
    answers: (answersByResponseId.get(r.id) ?? []).map(a => ({
      ...a,
      value: a.value as string | string[],
      fieldLabel: fieldLabels.get(a.fieldId) ?? a.fieldId,
    })),
  }));

  return { items, nextCursor };
}

export async function getResponseById(responseId: string, requesterId: string) {
  const [response] = await db
    .select()
    .from(responses)
    .where(eq(responses.id, responseId))
    .limit(1);

  if (!response) throw ApiError.notFound('Response not found');

  const [form] = await db.select({ creatorId: forms.creatorId }).from(forms).where(eq(forms.id, response.formId)).limit(1);
  if (!form || form.creatorId !== requesterId) throw ApiError.forbidden('Not your form');

  const answers = await db
    .select()
    .from(responseAnswers)
    .where(eq(responseAnswers.responseId, responseId));

  const fieldIds = [...new Set(answers.map(a => a.fieldId))];
  const fieldLabels = new Map<string, string>();
  if (fieldIds.length > 0) {
    const fieldRows = await db
      .select({ id: fields.id, label: fields.label })
      .from(fields)
      .where(inArray(fields.id, fieldIds));
    for (const f of fieldRows) fieldLabels.set(f.id, f.label);
  }

  return {
    ...response,
    answers: answers.map(a => ({
      ...a,
      value: a.value as string | string[],
      fieldLabel: fieldLabels.get(a.fieldId) ?? a.fieldId,
    })),
  };
}

export async function deleteResponse(responseId: string, requesterId: string) {
  const [response] = await db
    .select()
    .from(responses)
    .where(eq(responses.id, responseId))
    .limit(1);

  if (!response) throw ApiError.notFound('Response not found');

  const [form] = await db.select({ creatorId: forms.creatorId }).from(forms).where(eq(forms.id, response.formId)).limit(1);
  if (!form || form.creatorId !== requesterId) throw ApiError.forbidden('Not your form');

  await db.delete(responses).where(eq(responses.id, responseId));

  await db
    .update(forms)
    .set({ responseCount: sql`GREATEST(${forms.responseCount} - 1, 0)` })
    .where(eq(forms.id, response.formId));
}

async function verifyTurnstileToken(token?: string): Promise<boolean> {
  if (!token || !env.TURNSTILE_SECRET_KEY) return false;
  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret:   env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

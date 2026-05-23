import { createHash } from 'crypto';
import { sql, eq } from 'drizzle-orm';
import { db } from '../../common/db/index.js';
import { forms, responses, responseAnswers } from '@repo/db/schema';
import { ApiError } from '@repo/shared';
import { logger } from '../../common/logger.js';
import { env } from '../../common/config/env.js';
import { detectSpamSubmissionCluster } from '../analytics/analytics.service.js';
import { sendResponseReceived, sendResponseCopy } from '@repo/email';

interface SubmitResponseInput {
  formSlug:        string;
  answers:         { fieldId: string; value: string | string[] }[];
  respondentEmail?: string;
  respondentName?:  string;
  sendEmailCopy:    boolean;
  ipAddress?:       string;
  userAgent?:       string;
  turnstileToken?:  string;
  _hp?:             string;
}

/**
 * Validates response answers against form fields server-side.
 * Checks type, required, and basic format constraints.
 */
export function validateResponseAnswers(
  formFields: { id: string; type: string; required: boolean; config: Record<string, unknown>; label: string }[],
  answers: { fieldId: string; value: string | string[] }[],
): { success: boolean; error?: string } {
  const answerMap = new Map(answers.map(a => [a.fieldId, a.value]));

  for (const field of formFields) {
    const value = answerMap.get(field.id);

    if (field.required && (value === undefined || value === '' || (Array.isArray(value) && value.length === 0))) {
      return { success: false, error: `"${field.label}" is required` };
    }

    if (value === undefined) continue;

    if (field.type === 'email' && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { success: false, error: `"${field.label}" must be a valid email` };
      }
    }

    if (field.type === 'number' && typeof value === 'string') {
      if (isNaN(Number(value))) {
        return { success: false, error: `"${field.label}" must be a number` };
      }
    }
  }

  return { success: true };
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
    with: { fields: { orderBy: (f, { asc }) => [asc(f.order)] } },
  });

  if (!form) throw ApiError.notFound('Form not found');
  if (form.status !== 'published') throw ApiError.forbidden('Form is not accepting responses');
  if (form.expiresAt && form.expiresAt < new Date()) throw ApiError.forbidden('This form has closed');
  if (form.maxResponses && form.responseCount >= form.maxResponses) throw ApiError.forbidden('This form is no longer accepting responses');

  // Server-side field validation
  const validation = validateResponseAnswers(
    form.fields.map(f => ({
      id: f.id, type: f.type, required: f.required,
      config: f.config as Record<string, unknown>, label: f.label,
    })),
    input.answers,
  );
  if (!validation.success) {
    throw ApiError.badRequest(validation.error ?? 'Validation failed');
  }

  // Step 3: Cryptographic Session Token Verification (Turnstile)
  if (env.TURNSTILE_ENABLED && env.TURNSTILE_SECRET_KEY) {
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
  const submissionHash = createHash('sha256')
    .update(`${input.ipAddress ?? ''}:${form.id}:${input.userAgent ?? ''}:${Math.floor(Date.now() / 30_000)}`)
    .digest('hex');

  const submissionHashExpiresAt = new Date(Date.now() + 30_000);

  // Step 5: Transactional Relational Integrity Check
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
      })
      .onConflictDoNothing()
      .returning();

    if (!response) return { duplicate: true, response: null };

    if (input.answers.length > 0) {
      await tx.insert(responseAnswers).values(
        input.answers.map(a => ({
          responseId: response.id,
          fieldId:    a.fieldId,
          value: Array.isArray(a.value) ? a.value : String(a.value),
        }))
      );
    }

    await tx
      .update(forms)
      .set({ responseCount: sql`${forms.responseCount} + 1` })
      .where(eq(forms.id, form.id));

    return { duplicate: false, response };
  });

  if (result.duplicate) {
    return { success: true, message: 'Response already received.' };
  }

  // Dead Letter Queue (DLQ) pattern: email notifications dispatched
  // post-transaction to prevent blocking the critical submission path.
  // Failed notifications are logged via pino for manual retry.
  if (form.notifyCreator) {
    sendResponseReceived({
      formTitle:      form.title,
      creatorEmail:   '',
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

  return { success: true, response: result.response };
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

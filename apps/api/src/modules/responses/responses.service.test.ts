import { describe, it, expect, vi, beforeEach } from 'vitest';
import { responseAnswers } from '@repo/db/schema';
import { validateResponseAnswers, submitResponse, answerLabel } from './responses.service';

const dbMock = vi.hoisted(() => ({
  findFirst: vi.fn(),
  answerInserts: [] as unknown[][],
  responsesTable: { current: undefined as unknown },
}));

vi.mock('../../common/db/index', () => ({
  db: {
    query: { forms: { findFirst: dbMock.findFirst } },
    transaction: async (run: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        insert: (table: unknown) => ({
          values: (rows: unknown) => {
            if (table === responseAnswers) {
              dbMock.answerInserts.push(rows as unknown[]);
              return Promise.resolve();
            }
            return { onConflictDoNothing: () => ({ returning: async () => [{ id: 'response-1' }] }) };
          },
        }),
        update: () => ({ set: () => ({ where: () => ({ returning: async () => [{ responseCount: 1 }] }) }) }),
        delete: () => ({ where: async () => undefined }),
      };
      return run(tx);
    },
  },
}));

vi.mock('../analytics/analytics.service', () => ({
  detectSpamSubmissionCluster: vi.fn(async () => ({ isSpam: false, confidence: 0 })),
}));

vi.mock('@repo/email', () => ({
  sendResponseReceived: vi.fn(async () => undefined),
  sendResponseCopy: vi.fn(async () => undefined),
}));

const numberField = {
  id:       'f-number',
  type:     'number',
  required: true,
  config:   {},
  label:    'Age',
};

const requiredShortText = {
  id:       'f-name',
  type:     'short_text',
  required: true,
  config:   {},
  label:    'Full name',
};

const emailField = {
  id:       'f-email',
  type:     'email',
  required: true,
  config:   {},
  label:    'Email',
};

describe('validateResponseAnswers', () => {
  it('rejects text for number field', () => {
    const result = validateResponseAnswers(
      [numberField],
      [{ fieldId: 'f-number', value: 'not-a-number' }],
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Age');
  });

  it('rejects missing required field', () => {
    const result = validateResponseAnswers(
      [requiredShortText],
      [],
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Full name');
  });

  it('rejects invalid email format', () => {
    const result = validateResponseAnswers(
      [emailField],
      [{ fieldId: 'f-email', value: 'notanemail' }],
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Email');
  });

  it('accepts valid submission', () => {
    const result = validateResponseAnswers(
      [requiredShortText, emailField, numberField],
      [
        { fieldId: 'f-name',   value: 'Preet'                },
        { fieldId: 'f-email',  value: 'preet@formforge.jdevs.codes' },
        { fieldId: 'f-number', value: '27'                   },
      ],
    );
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('submitResponse honeypot', () => {
  it('returns silent success when honeypot is filled', async () => {
    const result = await submitResponse({
      formSlug:      'test-form',
      answers:       [{ fieldId: '11111111-1111-4111-8111-111111111111', value: 'test' }],
      sendEmailCopy: false,
      _hp:           'bot-filled-this',
    });
    expect(result).toEqual({ success: true, message: 'Response submitted successfully.' });
  });
});

describe('answerLabel', () => {
  it('keeps the label of a live question', () => {
    expect(answerLabel('Age', null)).toBe('Age');
  });
  it('marks a removed question', () => {
    expect(answerLabel('Age', new Date())).toBe('Removed question: Age');
  });
});

describe('submitResponse answers to removed questions', () => {
  const liveField = {
    id: 'f-live', type: 'short_text', required: false, config: {}, label: 'Name',
    conditions: null, order: 0,
  };
  const publishedForm = {
    id: 'form-1', slug: 'form', title: 'Form', status: 'published', expiresAt: null,
    requireEmail: false, allowAnonymous: true, passwordHash: null, notifyCreator: false,
    fields: [liveField], creator: { email: 'owner@example.com' },
  };

  beforeEach(() => {
    dbMock.answerInserts.length = 0;
    dbMock.findFirst.mockReset();
    dbMock.findFirst.mockResolvedValue(publishedForm);
  });

  it('stores live answers and drops one that is not a live question of the form', async () => {
    const result = await submitResponse({
      formSlug: 'form',
      answers: [
        { fieldId: 'f-live', value: 'Preet' },
        { fieldId: 'f-removed', value: 'stale answer' },
      ],
      sendEmailCopy: false,
    });
    expect(result.success).toBe(true);
    expect(dbMock.answerInserts).toEqual([
      [{ responseId: 'response-1', fieldId: 'f-live', value: 'Preet' }],
    ]);
  });

  it('skips the answers insert when nothing live remains', async () => {
    const result = await submitResponse({
      formSlug: 'form',
      answers: [{ fieldId: 'f-removed', value: 'stale answer' }],
      sendEmailCopy: false,
    });
    expect(result.success).toBe(true);
    expect(dbMock.answerInserts).toEqual([]);
  });
});

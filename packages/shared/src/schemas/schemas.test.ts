import { describe, it, expect } from 'vitest';
import { SubmitResponseSchema } from './responses.schemas';
import { ConditionalLogicSchema } from './fields.schemas';

const VALID_FIELD_ID = '11111111-1111-4111-8111-111111111111';
const VALID_SOURCE_FIELD_ID = '22222222-2222-4222-8222-222222222222';

describe('SubmitResponseSchema', () => {
  it('accepts honeypot value', () => {
    const result = SubmitResponseSchema.safeParse({
      formSlug: 'samurai-oath',
      answers:  [
        { fieldId: VALID_FIELD_ID, value: ['honor'] },
      ],
      _hp: 'bot-filled-this',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty answers array', () => {
    const result = SubmitResponseSchema.safeParse({
      formSlug: 'samurai-oath',
      answers:  [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid multi-select array answer', () => {
    const result = SubmitResponseSchema.safeParse({
      formSlug: 'samurai-oath',
      answers:  [
        { fieldId: VALID_FIELD_ID, value: ['honor', 'duty', 'sacrifice'] },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe('ConditionalLogicSchema', () => {
  it('parses valid show/hide rule', () => {
    const result = ConditionalLogicSchema.safeParse({
      action: 'show',
      match:  'any',
      rules:  [
        { sourceFieldId: VALID_SOURCE_FIELD_ID, operator: 'equals', value: 'yes' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty rules array', () => {
    const result = ConditionalLogicSchema.safeParse({
      action: 'show',
      match:  'any',
      rules:  [],
    });
    expect(result.success).toBe(false);
  });
});

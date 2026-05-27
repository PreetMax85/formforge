import { describe, it, expect } from 'vitest';
import { validateResponseAnswers, submitResponse } from './responses.service';

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

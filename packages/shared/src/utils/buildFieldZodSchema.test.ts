import { describe, it, expect } from 'vitest';
import { buildFieldZodSchema, validateResponseAnswers } from './buildFieldZodSchema';
import type { FieldForValidation } from './buildFieldZodSchema';

const numberField: FieldForValidation = {
  id: 'f-number', type: 'number', required: true, config: { min: 1, max: 10 }, label: 'Age',
};

const shortTextField: FieldForValidation = {
  id: 'f-text', type: 'short_text', required: true, config: { minLength: 3, maxLength: 20 }, label: 'Name',
};

const singleSelectField: FieldForValidation = {
  id: 'f-select', type: 'single_select', required: true, config: { options: ['red', 'green', 'blue'] }, label: 'Color',
};

const multiSelectField: FieldForValidation = {
  id: 'f-multi', type: 'multi_select', required: false, config: { options: ['a', 'b', 'c'], maxSelections: 2 }, label: 'Tags',
};

const dateField: FieldForValidation = {
  id: 'f-date', type: 'date', required: true, config: { minDate: '2026-01-01', maxDate: '2026-12-31' }, label: 'Event date',
};

const checkboxField: FieldForValidation = {
  id: 'f-check', type: 'checkbox', required: true, config: {}, label: 'I agree',
};

describe('buildFieldZodSchema', () => {
  it('enforces number min/max from config', () => {
    const schema = buildFieldZodSchema(numberField);
    expect(schema.safeParse('5').success).toBe(true);
    expect(schema.safeParse('0').success).toBe(false);
    expect(schema.safeParse('11').success).toBe(false);
    expect(schema.safeParse('not-a-number').success).toBe(false);
  });

  it('enforces text minLength/maxLength from config', () => {
    const schema = buildFieldZodSchema(shortTextField);
    expect(schema.safeParse('Preet').success).toBe(true);
    expect(schema.safeParse('ab').success).toBe(false);
    expect(schema.safeParse('this-is-a-very-long-name-that-exceeds-max').success).toBe(false);
  });

  it('enforces single_select options from config', () => {
    const schema = buildFieldZodSchema(singleSelectField);
    expect(schema.safeParse('red').success).toBe(true);
    expect(schema.safeParse('purple').success).toBe(false);
  });

  it('enforces multi_select maxSelections from config', () => {
    const schema = buildFieldZodSchema(multiSelectField);
    expect(schema.safeParse(['a', 'b']).success).toBe(true);
    expect(schema.safeParse(['a', 'b', 'c']).success).toBe(false);
    expect(schema.safeParse(['a', 'x']).success).toBe(false);
  });

  it('enforces date minDate/maxDate from config', () => {
    const schema = buildFieldZodSchema(dateField);
    expect(schema.safeParse('2026-06-15').success).toBe(true);
    expect(schema.safeParse('2025-01-01').success).toBe(false);
    expect(schema.safeParse('2027-01-01').success).toBe(false);
  });
});

describe('validateResponseAnswers — dynamic config enforcement', () => {
  it('rejects number below config min', () => {
    const result = validateResponseAnswers(
      [numberField],
      [{ fieldId: 'f-number', value: '0' }],
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Age');
  });

  it('rejects text below config minLength', () => {
    const result = validateResponseAnswers(
      [shortTextField],
      [{ fieldId: 'f-text', value: 'ab' }],
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Name');
  });

  it('rejects single_select option not in config options', () => {
    const result = validateResponseAnswers(
      [singleSelectField],
      [{ fieldId: 'f-select', value: 'purple' }],
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Color');
  });

  it('rejects required checkbox unchecked (value=false)', () => {
    const result = validateResponseAnswers(
      [checkboxField],
      [{ fieldId: 'f-check', value: 'false' }],
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('I agree');
  });

  it('accepts valid submission with config constraints', () => {
    const result = validateResponseAnswers(
      [numberField, shortTextField, singleSelectField, dateField, checkboxField],
      [
        { fieldId: 'f-number', value: '5' },
        { fieldId: 'f-text',   value: 'Preet' },
        { fieldId: 'f-select', value: 'red' },
        { fieldId: 'f-date',   value: '2026-06-15' },
        { fieldId: 'f-check',  value: 'true' },
      ],
    );
    expect(result.success).toBe(true);
  });

  it('skips optional field with no answer', () => {
    const result = validateResponseAnswers(
      [multiSelectField],
      [],
    );
    expect(result.success).toBe(true);
  });
});

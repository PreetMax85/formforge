import { z } from 'zod';

/**
 * Input shape for dynamic Zod schema generation. Mirrors the subset of
 * the Drizzle Field row needed for validation — type, required flag,
 * config JSONB, and label (for error messages).
 */
export interface FieldForValidation {
  id:       string;
  type:     string;
  required: boolean;
  config:   Record<string, unknown>;
  label:    string;
}

/**
 * Builds a Zod schema for a single field's answer value based on the
 * field type and its stored config JSONB constraints.
 *
 * This is the dynamic Zod generator: instead of imperatively checking
 * min/max/minLength/maxLength/options/maxSelections/regex/minDate/maxDate
 * in a hand-rolled loop, each field type maps to a Zod schema that
 * enforces its config constraints declaratively.
 *
 * @param field  The field definition with type, required, config, label
 * @returns      A Zod schema validating the answer value for this field
 */
export function buildFieldZodSchema(field: FieldForValidation): z.ZodType {
  const config = field.config ?? {};

  let valueSchema: z.ZodType;

  switch (field.type) {
    case 'short_text':
    case 'long_text': {
      let s = z.string();
      if (typeof config.minLength === 'number') {
        s = s.min(config.minLength, `must be at least ${config.minLength} characters`);
      }
      if (typeof config.maxLength === 'number') {
        s = s.max(config.maxLength, `must be at most ${config.maxLength} characters`);
      }
      valueSchema = s;
      break;
    }

    case 'email': {
      valueSchema = z.string().email('must be a valid email');
      break;
    }

    case 'number': {
      let s = z.string().refine((v) => !isNaN(Number(v)), 'must be a number');
      if (typeof config.min === 'number') {
        s = s.refine((v) => Number(v) >= (config.min as number), `must be at least ${config.min}`);
      }
      if (typeof config.max === 'number') {
        s = s.refine((v) => Number(v) <= (config.max as number), `must be at most ${config.max}`);
      }
      valueSchema = s;
      break;
    }

    case 'single_select':
    case 'dropdown': {
      const options = Array.isArray(config.options) ? (config.options as string[]) : [];
      valueSchema = z.string().refine(
        (v) => options.includes(v),
        'must be one of the available options',
      );
      break;
    }

    case 'multi_select': {
      const options = Array.isArray(config.options) ? (config.options as string[]) : [];
      let s = z.array(z.string()).refine(
        (arr) => arr.every((v) => options.includes(v)),
        'must be from the available options',
      );
      if (typeof config.maxSelections === 'number') {
        s = s.max(config.maxSelections as number, `select at most ${config.maxSelections}`);
      }
      valueSchema = s;
      break;
    }

    case 'checkbox': {
      valueSchema = z.string().refine(
        (v) => v === 'true' || v === 'false',
        'must be true or false',
      );
      break;
    }

    case 'rating': {
      const maxRating = typeof config.max === 'number' ? (config.max as number) : 5;
      valueSchema = z.string().refine((v) => {
        const n = Number(v);
        return !isNaN(n) && n >= 1 && n <= maxRating;
      }, `must be between 1 and ${maxRating}`);
      break;
    }

    case 'date': {
      let s = z.string();
      if (typeof config.minDate === 'string') {
        const min = new Date(config.minDate as string);
        s = s.refine((v) => new Date(v) >= min, `must be on or after ${config.minDate}`);
      }
      if (typeof config.maxDate === 'string') {
        const max = new Date(config.maxDate as string);
        s = s.refine((v) => new Date(v) <= max, `must be on or before ${config.maxDate}`);
      }
      valueSchema = s;
      break;
    }

    default:
      valueSchema = z.string();
  }

  return valueSchema;
}

/**
 * Validates response answers against form fields using dynamically
 * generated Zod schemas. Replaces the hand-rolled imperative loop —
 * now every constraint in field.config (min, max, minLength, maxLength,
 * options, maxSelections, minDate, maxDate) is enforced via Zod.
 *
 * @param formFields  The visible fields to validate against
 * @param answers     The submitted answers
 * @returns           { success: true } or { success: false, error }
 */
export function validateResponseAnswers(
  formFields: FieldForValidation[],
  answers: { fieldId: string; value: string | string[] }[],
): { success: boolean; error?: string } {
  const answerMap = new Map(answers.map((a) => [a.fieldId, a.value]));

  for (const field of formFields) {
    const value = answerMap.get(field.id);

    /* Required check — empty string, empty array, or unchecked checkbox count as empty */
    if (field.required) {
      const isEmpty =
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (field.type === 'checkbox' && value === 'false');
      if (isEmpty) {
        return { success: false, error: `"${field.label}" is required` };
      }
    }

    /* Skip optional fields with no answer */
    if (value === undefined) continue;

    /* Dynamic Zod validation against field type + config constraints */
    const schema = buildFieldZodSchema(field);
    const result = schema.safeParse(value);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? 'is invalid';
      return { success: false, error: `"${field.label}" ${msg}` };
    }
  }

  return { success: true };
}

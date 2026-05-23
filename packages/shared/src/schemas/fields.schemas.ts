import { z } from 'zod';

export const FieldTypeEnum = z.enum([
  'short_text', 'long_text', 'email', 'number',
  'single_select', 'multi_select', 'checkbox',
  'rating', 'date', 'dropdown',
]);

export const FieldConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('short_text'),
    minLength: z.number().optional(), maxLength: z.number().optional() }),
  z.object({ type: z.literal('long_text'),
    minLength: z.number().optional(), maxLength: z.number().optional() }),
  z.object({ type: z.literal('email') }),
  z.object({ type: z.literal('number'),
    min: z.number().optional(), max: z.number().optional() }),
  z.object({ type: z.literal('single_select'),
    options: z.array(z.string()).min(1) }),
  z.object({ type: z.literal('multi_select'),
    options: z.array(z.string()).min(1),
    maxSelections: z.number().optional() }),
  z.object({ type: z.literal('checkbox') }),
  z.object({ type: z.literal('rating'),
    max: z.union([z.literal(5), z.literal(10)]).default(5) }),
  z.object({ type: z.literal('date'),
    minDate: z.string().optional(), maxDate: z.string().optional() }),
  z.object({ type: z.literal('dropdown'),
    options: z.array(z.string()).min(1) }),
]);

export const ReorderFieldsSchema = z.object({
  formId: z.string().uuid(),
  fields: z.array(z.object({
    id:    z.string().uuid(),
    order: z.number().int().min(0),
  })).min(1).max(50),
});

export const ConditionRuleSchema = z.object({
  sourceFieldId: z.string().uuid(),
  operator:      z.enum([
                   'equals', 'not_equals', 'contains',
                   'greater_than', 'less_than',
                   'is_empty', 'is_not_empty',
                 ]),
  value:         z.string(),
});

export const ConditionalLogicSchema = z.object({
  action: z.enum(['show', 'hide']),
  match:  z.enum(['any', 'all']),
  rules:  z.array(ConditionRuleSchema).min(1).max(10),
});

export const UpsertFieldSchema = z.object({
  id:          z.string().uuid().optional(),
  formId:      z.string().uuid(),
  type:        FieldTypeEnum,
  label:       z.string().min(1).max(500),
  placeholder: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  required:    z.boolean().default(false),
  order:       z.number().int().min(0),
  config:      z.record(z.string(), z.unknown()).default({}),
  conditions:  ConditionalLogicSchema.optional(),
});

export const UpsertFieldsSchema = z.object({
  formId: z.string().uuid(),
  fields: z.array(UpsertFieldSchema).max(50),
});

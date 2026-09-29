import { z } from 'zod';
import { FieldTypeEnum, ConditionalLogicSchema } from './fields.schemas';
import { FORM_THEMES } from './forms.schemas';

export const MAX_DRAFT_FIELDS = 50;

const CHOICE_TYPES = new Set(['single_select', 'multi_select', 'dropdown']);

// Shape only. Empty labels and titles are allowed so autosave never fails
// while the creator is mid-edit; findPublishProblems enforces completeness.
export const DraftFieldSchema = z.object({
  id:          z.string().uuid(),
  type:        FieldTypeEnum,
  label:       z.string().max(500),
  placeholder: z.string().max(500).nullable(),
  description: z.string().max(1000).nullable(),
  required:    z.boolean(),
  config:      z.record(z.string(), z.unknown()),
  conditions:  ConditionalLogicSchema.nullable(),
});

export const DraftContentSchema = z.object({
  title:           z.string().max(255),
  description:     z.string().max(1000).nullable(),
  theme:           z.enum(FORM_THEMES),
  thankYouTitle:   z.string().max(255).nullable(),
  thankYouMessage: z.string().max(1000).nullable(),
  fields:          z.array(DraftFieldSchema).max(MAX_DRAFT_FIELDS),
}).superRefine((content, ctx) => {
  const ids = new Set<string>();
  content.fields.forEach((field, index) => {
    if (ids.has(field.id)) {
      ctx.addIssue({ code: 'custom', path: ['fields', index, 'id'], message: 'Duplicate question id' });
    }
    ids.add(field.id);
  });
  content.fields.forEach((field, index) => {
    field.conditions?.rules.forEach((rule, ruleIndex) => {
      if (rule.sourceFieldId === field.id || !ids.has(rule.sourceFieldId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['fields', index, 'conditions', 'rules', ruleIndex, 'sourceFieldId'],
          message: 'Rule must refer to another question in this form',
        });
      }
    });
  });
});

export type DraftField   = z.infer<typeof DraftFieldSchema>;
export type DraftContent = z.infer<typeof DraftContentSchema>;

export const GetDraftSchema = z.object({ formId: z.string().uuid() });

export const SaveDraftSchema = z.object({
  formId:       z.string().uuid(),
  baseRevision: z.number().int().min(1),
  content:      DraftContentSchema,
});

export const DiscardDraftSchema = z.object({
  formId:       z.string().uuid(),
  baseRevision: z.number().int().min(1),
});

/**
 * Lists what stops a draft from being published, in plain words, in the
 * order a creator would fix them. An empty array means publishable.
 */
export function findPublishProblems(content: DraftContent): string[] {
  const problems: string[] = [];
  if (content.title.trim() === '') problems.push('Give the form a title.');
  if (content.fields.length === 0) problems.push('Add at least one question.');
  content.fields.forEach((field, index) => {
    const n = index + 1;
    if (field.label.trim() === '') problems.push(`Question ${n} needs a label.`);
    if (CHOICE_TYPES.has(field.type)) {
      const options = Array.isArray(field.config.options) ? field.config.options : [];
      const usable = options.filter((o): o is string => typeof o === 'string' && o.trim() !== '');
      if (usable.length === 0) problems.push(`Question ${n} needs at least one option.`);
    }
  });
  return problems;
}

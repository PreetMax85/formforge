import { ConditionalLogicSchema } from '../schemas/fields.schemas';

export interface FieldForGraph {
  id:         string;
  conditions: unknown;
  [key: string]: unknown;
}

/**
 * Builds a directed dependency graph of conditional fields and resolves
 * visible fields in topological order. Handles multi-level conditions —
 * e.g. Field C shows only if Field B is visible AND Field B shows only
 * if Field A = "Yes". Used by both the Zustand store (frontend) and
 * server-side submission validation (backend).
 */
export function resolveVisibleFieldGraph(
  fields: FieldForGraph[],
  answers: Record<string, string | string[]>
): FieldForGraph[] {
  const visible  = new Set<string>();
  const resolved = new Set<string>();

  function isVisible(fieldId: string): boolean {
    if (resolved.has(fieldId)) return visible.has(fieldId);
    resolved.add(fieldId);

    const field = fields.find(f => f.id === fieldId);
    if (!field) return false;

    if (!field.conditions) {
      visible.add(fieldId);
      return true;
    }

    const parsed = ConditionalLogicSchema.safeParse(field.conditions);
    if (!parsed.success) {
      visible.add(fieldId);
      return true;
    }

    const logic = parsed.data;

    const results = logic.rules.map(rule => {
      if (!isVisible(rule.sourceFieldId)) return false;
      return evaluateRule(rule, answers);
    });

    const passes = logic.match === 'all'
      ? results.every(Boolean)
      : results.some(Boolean);

    const fieldVisible = logic.action === 'show' ? passes : !passes;
    if (fieldVisible) visible.add(fieldId);
    return fieldVisible;
  }

  for (const field of fields) {
    isVisible(field.id);
  }

  return fields.filter(f => visible.has(f.id));
}

interface ConditionRule {
  sourceFieldId: string;
  operator:      string;
  value:         string;
}

function evaluateRule(
  rule: ConditionRule,
  answers: Record<string, string | string[]>
): boolean {
  const raw = answers[rule.sourceFieldId];
  const val = Array.isArray(raw) ? raw.join(',') : String(raw ?? '');

  switch (rule.operator) {
    case 'equals':       return val === rule.value;
    case 'not_equals':   return val !== rule.value;
    case 'contains':     return val.toLowerCase().includes(rule.value.toLowerCase());
    case 'greater_than': return Number(val) > Number(rule.value);
    case 'less_than':    return Number(val) < Number(rule.value);
    case 'is_empty':     return val.trim() === '';
    case 'is_not_empty': return val.trim() !== '';
    default:             return true;
  }
}

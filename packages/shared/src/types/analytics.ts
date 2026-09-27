export interface DropoffRow {
  field_id:       string;
  field_label:    string;
  field_order:    number;
  response_count: number;
  /**
   * Percentage of the previous field's answer count that answered this one
   * (100 for the first field). Null when there is nothing to compare against:
   * the first field has no answers, or the previous field has none.
   */
  retention_pct:  number | null;
}

export interface FunnelStage {
  stage:          'viewed' | 'started' | 'halfway' | 'submitted';
  count:          number;
  conversionRate: number;
}

export interface FormInsight {
  type:    'positive' | 'warning' | 'neutral';
  icon:    string;
  message: string;
}

export interface FormStats {
  completionRate:           number;
  recentResponses:          number;
  previousResponses:        number;
  avgDropoffRate:           number;
  avgFieldsAnswered:        number;
  totalFields:              number;
  totalUnconditionalFields: number;
  fieldDropoffs?:           DropoffRow[];
}

export interface FormAnalyticsStats extends FormStats {
  totalResponses: number;
}

/**
 * Per-option breakdown for a single select / multi-select / dropdown /
 * checkbox / rating field. Each entry is one option value + how many
 * respondents picked it.
 */
export interface OptionBreakdown {
  fieldId:    string;
  fieldLabel: string;
  fieldType:  string;
  options:    { value: string; count: number }[];
}

export interface DropoffRow {
  field_id:       string;
  field_label:    string;
  field_order:    number;
  response_count: number;
  retention_pct:  number;
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

'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Zap, AlertCircle, Activity, Info, PieChart as PieIcon } from 'lucide-react';
import type { DropoffRow, FunnelStage, FormInsight, OptionBreakdown } from '@repo/shared';

/* ── Shared panel wrapper ─────────────────────────────────────────── */
function Panel({
  title,
  icon: Icon,
  children,
}: {
  title:    string;
  icon:     React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: '#141414', border: '1px solid #2a2a2a', padding: '24px' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
        <Icon size={14} style={{ color: '#569cd6' }} />
        <span
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '11px',
            color:         '#9ca3af',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ── Shared empty state ───────────────────────────────────────────── */
function ChartEmpty({ message }: { message: string }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ height: '160px' }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize:   '11px',
          color:      '#374151',
        }}
      >
        {message}
      </span>
    </div>
  );
}

/* ── Recharts shared tooltip ──────────────────────────────────────── */
function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?:  boolean;
  payload?: { value: number; name: string }[];
  label?:   string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#252526',
        border:     '1px solid #3c3c3c',
        padding:    '8px 12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize:   '11px',
      }}
    >
      {label && <p style={{ color: '#9ca3af', marginBottom: '4px' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: '#d4d4d4' }}>
          {p.value}
        </p>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DROP-OFF FUNNEL (Q1 → Qn)
══════════════════════════════════════════════════════════════════ */
interface DropoffFunnelProps {
  data: DropoffRow[];
}

/**
 * Q1→Qn drop-off funnel — horizontal bar chart showing retention % per field.
 */
export function DropoffFunnel({ data }: DropoffFunnelProps) {
  const chartData = data.map((row) => ({
    name:      row.field_label.length > 22
      ? row.field_label.slice(0, 22) + '…'
      : row.field_label,
    retention: Number(row.retention_pct),
    responses: Number(row.response_count),
  }));

  return (
    <Panel title="Q1 → Qn Drop-off" icon={TrendingDown}>
      {data.length === 0 ? (
        <ChartEmpty message="No field data yet. Add fields and collect responses." />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(data.length * 40, 160)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 8, right: 48, top: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              domain={[0, 105]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(86,156,214,0.05)' }} />
            <Bar
              dataKey="retention"
              fill="#569cd6"
              radius={0}
              background={{ fill: '#1e1e1e' }}
              label={{
                position: 'right',
                formatter: (v: number) => `${v}%`,
                style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: '#6b7280' },
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COMPLETION FUNNEL (Views → Submit)
══════════════════════════════════════════════════════════════════ */
interface CompletionFunnelProps {
  data: FunnelStage[];
}

const STAGE_COLORS: Record<string, string> = {
  viewed:    '#3c3c3c',
  started:   '#569cd6',
  halfway:   '#4ec9b0',
  submitted: '#4caf50',
};

const STAGE_LABELS: Record<string, string> = {
  viewed:    'Viewed',
  started:   'Started',
  halfway:   'Halfway',
  submitted: 'Submitted',
};

/**
 * 4-stage completion funnel with conversion rates.
 */
export function CompletionFunnel({ data }: CompletionFunnelProps) {
  const max = data[0]?.count ?? 1;

  return (
    <Panel title="Views → Submit Funnel" icon={TrendingUp}>
      {data.length === 0 ? (
        <ChartEmpty message="No view data yet." />
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((stage, i) => {
            const width = max > 0 ? (stage.count / max) * 100 : 0;
            const color = STAGE_COLORS[stage.stage] ?? '#569cd6';
            return (
              <div key={stage.stage}>
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: '5px' }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize:   '11px',
                      color:      '#9ca3af',
                    }}
                  >
                    {STAGE_LABELS[stage.stage] ?? stage.stage}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize:   '11px',
                        color:      '#6b7280',
                      }}
                    >
                      {stage.count.toLocaleString()}
                    </span>
                    {i > 0 && (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize:   '10px',
                          color:      stage.conversionRate >= 50 ? '#4ec9b0' : '#ff9800',
                          background: stage.conversionRate >= 50 ? 'rgba(78,201,176,0.1)' : 'rgba(255,152,0,0.1)',
                          padding:    '1px 6px',
                        }}
                      >
                        {stage.conversionRate}%
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ height: '8px', background: '#1e1e1e', position: 'relative' }}>
                  <div
                    style={{
                      position:   'absolute',
                      left:       0,
                      top:        0,
                      height:     '100%',
                      width:      `${width}%`,
                      background: color,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TIME SERIES
══════════════════════════════════════════════════════════════════ */
interface TimeSeriesProps {
  data:        { date: string; count: number }[];
  granularity: 'day' | 'week' | 'month';
  onGranularityChange: (g: 'day' | 'week' | 'month') => void;
}

/**
 * Responses over time — line chart with granularity toggle.
 */
export function TimeSeries({ data, granularity, onGranularityChange }: TimeSeriesProps) {
  return (
    <Panel title="Responses Over Time" icon={Activity}>
      {/* Granularity toggle */}
      <div className="flex gap-1" style={{ marginBottom: '16px' }}>
        {(['day', 'week', 'month'] as const).map((g) => (
          <button
            key={g}
            onClick={() => onGranularityChange(g)}
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '10px',
              padding:       '3px 10px',
              background:    granularity === g ? '#569cd6' : 'transparent',
              border:        `1px solid ${granularity === g ? '#569cd6' : '#2a2a2a'}`,
              color:         granularity === g ? '#0e0e0e' : '#6b7280',
              cursor:        'pointer',
              letterSpacing: '0.06em',
              transition:    'all 0.15s',
            }}
          >
            {g}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <ChartEmpty message="No responses yet in this time range." />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return granularity === 'day'
                  ? `${d.getMonth() + 1}/${d.getDate()}`
                  : granularity === 'week'
                  ? `W${Math.ceil(d.getDate() / 7)}`
                  : d.toLocaleString('default', { month: 'short' });
              }}
            />
            <YAxis
              tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<DarkTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#569cd6"
              strokeWidth={2}
              dot={{ fill: '#569cd6', r: 3 }}
              activeDot={{ r: 5, fill: '#569cd6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}

/* ══════════════════════════════════════════════════════════════════
   INSIGHT CARDS
══════════════════════════════════════════════════════════════════ */
interface InsightCardsProps {
  insights: FormInsight[];
}

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  'trending-up':   TrendingUp,
  'trending-down': TrendingDown,
  'alert-circle':  AlertCircle,
  'zap':           Zap,
  'activity':      Activity,
  'info':          Info,
};

const INSIGHT_COLORS: Record<FormInsight['type'], { border: string; icon: string; bg: string }> = {
  positive: { border: '#4caf5040', icon: '#4caf50', bg: 'rgba(76,175,80,0.05)'    },
  warning:  { border: '#ff980040', icon: '#ff9800', bg: 'rgba(255,152,0,0.05)'    },
  neutral:  { border: '#2a2a2a',   icon: '#6b7280', bg: 'transparent'             },
};

/**
 * Rule-based insight cards from generateFormInsightsSummary output.
 */
export function InsightCards({ insights }: InsightCardsProps) {
  return (
    <Panel title="AI Insights" icon={Zap}>
      {insights.length === 0 ? (
        <ChartEmpty message="Collect more responses to unlock insights." />
      ) : (
        <div className="flex flex-col gap-3">
          {insights.map((insight, i) => {
            const colors = INSIGHT_COLORS[insight.type];
            const Icon   = INSIGHT_ICONS[insight.icon] ?? Info;
            return (
              <div
                key={i}
                className="flex items-start gap-3"
                style={{
                  padding:    '12px 14px',
                  background: colors.bg,
                  border:     `1px solid ${colors.border}`,
                }}
              >
                <Icon
                  size={14}
                  style={{ color: colors.icon, flexShrink: 0, marginTop: '1px' }}
                />
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize:   '13px',
                    color:      '#9ca3af',
                    lineHeight: 1.55,
                  }}
                >
                  {insight.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FIELD BREAKDOWN
══════════════════════════════════════════════════════════════════ */
interface FieldBreakdownProps {
  data: DropoffRow[];
}

/**
 * Per-field response count bar chart.
 */
export function FieldBreakdown({ data }: FieldBreakdownProps) {
  const chartData = data.map((row) => ({
    name:  row.field_label.length > 18
      ? row.field_label.slice(0, 18) + '…'
      : row.field_label,
    count: Number(row.response_count),
  }));

  return (
    <Panel title="Field Response Counts" icon={Activity}>
      {data.length === 0 ? (
        <ChartEmpty message="No field data yet." />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              angle={-35}
              textAnchor="end"
            />
            <YAxis
              tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(86,156,214,0.05)' }} />
            <Bar dataKey="count" fill="#4ec9b0" radius={0} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}

/* ══════════════════════════════════════════════════════════════════
   OPTION BREAKDOWN (per select / checkbox / rating field)
════════════════════════════════════════════════════════════════ */

const OPTION_PIE_COLORS = [
  '#569cd6', '#4ec9b0', '#ce9178', '#dcdcaa', '#c586c0',
  '#4caf50', '#ff9800', '#9ca3af', '#f87171', '#60a5fa',
];

/**
 * Formats an option value for display: humanizes "true"/"false" for
 * checkbox fields, trims long values, and labels unknown options.
 */
function formatOptionLabel(value: string, fieldType: string): string {
  if (fieldType === 'checkbox') {
    if (value === 'true') return 'Yes';
    if (value === 'false') return 'No';
  }
  if (value.length > 24) return value.slice(0, 22) + '…';
  return value;
}

interface OptionBreakdownChartProps {
  data: OptionBreakdown[];
}

/**
 * Per-option pie charts for select / multi-select / checkbox / rating
 * fields. Renders one donut chart per eligible field showing the
 * distribution of answers across configured options.
 */
export function OptionBreakdownChart({ data }: OptionBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <Panel title="Option Breakdown" icon={PieIcon}>
        <ChartEmpty message="No select / checkbox / rating fields on this form." />
      </Panel>
    );
  }

  return (
    <Panel title="Option Breakdown" icon={PieIcon}>
      <div className="flex flex-col gap-6">
        {data.map((field) => {
          const total = field.options.reduce((sum, o) => sum + o.count, 0);
          const chartData = field.options.map((o) => ({
            name:  formatOptionLabel(o.value, field.fieldType),
            value: o.count,
          }));

          return (
            <div key={field.fieldId}>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: '10px' }}
              >
                <span
                  style={{
                    fontFamily:   "'Inter', sans-serif",
                    fontSize:     '13px',
                    fontWeight:   500,
                    color:        '#d4d4d4',
                  }}
                >
                  {field.fieldLabel}
                </span>
                <span
                  style={{
                    fontFamily:    "'JetBrains Mono', monospace",
                    fontSize:      '10px',
                    color:         '#6b7280',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {field.fieldType.replace('_', ' ')}
                  {total > 0 ? ` · ${total} answers` : ''}
                </span>
              </div>

              {total === 0 ? (
                <ChartEmpty message="No answers for this field yet." />
              ) : (
                <div className="flex items-center gap-6" style={{ flexWrap: 'wrap' }}>
                  <ResponsiveContainer width={220} height={220}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                        stroke="#0e0e0e"
                        strokeWidth={2}
                      >
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={OPTION_PIE_COLORS[i % OPTION_PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<DarkTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend with counts */}
                  <div className="flex flex-col gap-1.5" style={{ flex: 1, minWidth: '180px' }}>
                    {chartData.map((opt, i) => {
                      const pct = total > 0 ? Math.round((opt.value / total) * 100) : 0;
                      return (
                        <div key={opt.name} className="flex items-center gap-2">
                          <span
                            style={{
                              display:    'inline-block',
                              width:       '10px',
                              height:      '10px',
                              background:  OPTION_PIE_COLORS[i % OPTION_PIE_COLORS.length],
                              flexShrink:  0,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize:   '12px',
                              color:      '#9ca3af',
                              flex:       1,
                              overflow:   'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {opt.name}
                          </span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize:   '11px',
                              color:      '#6b7280',
                              flexShrink: 0,
                            }}
                          >
                            {opt.value} · {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
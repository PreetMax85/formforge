'use client';

import { useState, use } from 'react';
import { trpc } from '~/trpc/client';
import {
  FormHealthScore,
} from '~/components/analytics/FormHealthScore';
import {
  DropoffFunnel,
  CompletionFunnel,
  TimeSeries,
  InsightCards,
  FieldBreakdown,
} from '~/components/analytics/AnalyticsComponents';
import {
  BarChart2, ExternalLink, Copy, CheckCircle,
  FileText, Clock, Eye, QrCode,
} from 'lucide-react';
import Link from 'next/link';
import QRCodeModal from '~/components/shared/QRCodeModal';
import LoadingScreen from '~/components/shared/LoadingScreen';
import { AnimatePresence } from 'framer-motion';
import { useDelayedLoading } from '~/lib/hooks/useDelayedLoading';

/* ── Loading skeleton ─────────────────────────────────────────────── */
function Skeleton({ h = 200 }: { h?: number }) {
  return (
    <div
      style={{
        height:     `${h}px`,
        background: '#141414',
        border:     '1px solid #2a2a2a',
        animation:  'skeleton-pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

/* ── Stat pill ────────────────────────────────────────────────────── */
function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon:  React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background:  '#141414',
        border:      '1px solid #2a2a2a',
        padding:     '16px 20px',
        display:     'flex',
        alignItems:  'center',
        gap:         '12px',
      }}
    >
      <Icon size={16} style={{ color: '#569cd6', flexShrink: 0 }} />
      <div>
        <div
          style={{
            fontFamily:  "'Space Grotesk', sans-serif",
            fontSize:    '22px',
            fontWeight:  700,
            color:       '#d4d4d4',
            lineHeight:  1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '10px',
            color:         '#6b7280',
            marginTop:     '4px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function FormOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: formId } = use(params);

  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [copied,  setCopied]  = useState(false);
  const [qrOpen,  setQrOpen]  = useState(false);

  /* ── tRPC queries ────────────────────────────────────────────── */
  const formQuery = trpc.forms.byId.useQuery({ id: formId });

  const statsQuery        = trpc.analytics.formStats.useQuery({ formId });
  const healthQuery       = trpc.analytics.healthScore.useQuery({ formId });
  const dropoffQuery      = trpc.analytics.dropoffFunnel.useQuery({ formId });
  const completionQuery   = trpc.analytics.completionFunnel.useQuery({ formId });
  const timeSeriesQuery   = trpc.analytics.timeSeries.useQuery({ formId, granularity });
  const insightsQuery     = trpc.analytics.insights.useQuery({ formId });

  /* ── 4-state pattern on primary data ────────────────────────── */
  if (formQuery.error) {
    return (
      <div
        style={{
          padding:    '32px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize:   '12px',
          color:      '#ef4444',
        }}
      >
        [ERROR] {formQuery.error.message}
      </div>
    );
  }

  if (!formQuery.data) {
    return (
      <div
        style={{
          padding:    '32px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize:   '12px',
          color:      '#4b5563',
        }}
      >
        Form not found in scene.
      </div>
    );
  }

  const form  = formQuery.data.data;
  const stats = statsQuery.data?.data;
  const score = healthQuery.data?.data ?? null;

  const anyAnalyticsError = statsQuery.error ?? healthQuery.error ?? insightsQuery.error ??
    completionQuery.error ?? dropoffQuery.error ?? timeSeriesQuery.error;

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/f/${form.slug}`
    : `/f/${form.slug}`;

  function copyLink() {
    void navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const showLoading = useDelayedLoading(formQuery.isLoading);

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <AnimatePresence mode="wait">
      {showLoading ? (
        <div key="loading" style={{ padding: '32px' }}>
          <LoadingScreen variant="inline" message="Loading analytics..." />
        </div>
      ) : (
        <>
        <div
          style={{
            padding:    '24px',
            color:      '#d4d4d4',
            fontFamily: "'Inter', sans-serif",
          }}
        >
      {/* ── Form header ────────────────────────────────────────── */}
      <div
        style={{
          background:   '#141414',
          border:       '1px solid #2a2a2a',
          padding:      '20px 24px',
          marginBottom: '20px',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'space-between',
          flexWrap:     'wrap',
          gap:          '12px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize:   '20px',
              fontWeight: 600,
              color:      '#d4d4d4',
              marginBottom:'4px',
            }}
          >
            {form.title}
          </h1>
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '10px',
                color:         form.status === 'published' ? '#4caf50' : '#ff9800',
                background:    form.status === 'published' ? 'rgba(76,175,80,0.1)' : 'rgba(255,152,0,0.1)',
                padding:       '2px 8px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {form.status}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize:   '11px',
                color:      '#4b5563',
              }}
            >
              /{form.slug}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrOpen(true)}
            className="flex items-center gap-1.5"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   '11px',
              color:      '#9ca3af',
              background: 'transparent',
              border:     '1px solid #3c3c3c',
              padding:    '6px 12px',
              cursor:     'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#569cd6';
              (e.currentTarget as HTMLButtonElement).style.color = '#569cd6';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#3c3c3c';
              (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
            }}
          >
            <QrCode size={12} />
            QR Code
          </button>

          <button
            onClick={copyLink}
            className="flex items-center gap-1.5"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   '11px',
              color:      copied ? '#4ec9b0' : '#9ca3af',
              background: 'transparent',
              border:     '1px solid #3c3c3c',
              padding:    '6px 12px',
              cursor:     'pointer',
              transition: 'color 0.15s',
            }}
          >
            {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>

          {form.status === 'published' && (
            <Link
              href={`/f/${form.slug}`}
              target="_blank"
              className="flex items-center gap-1.5"
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '11px',
                color:         '#569cd6',
                textDecoration:'none',
                border:        '1px solid #569cd6',
                padding:       '6px 12px',
                transition:    'opacity 0.15s',
              }}
            >
              <ExternalLink size={12} />
              View live
            </Link>
          )}

          <Link
            href={`/dashboard/forms/${formId}/builder`}
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '11px',
              color:         '#0e0e0e',
              textDecoration:'none',
              background:    '#569cd6',
              padding:       '6px 12px',
              fontWeight:    700,
            }}
          >
            Open Builder
          </Link>
        </div>
      </div>

      {/* ── Stat pills ─────────────────────────────────────────── */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4"
        style={{ gap: '1px', background: '#2a2a2a', marginBottom: '20px' }}
      >
        <StatPill
          icon={FileText}
          label="Total Responses"
          value={(stats?.totalResponses ?? form.responseCount).toLocaleString()}
        />
        <StatPill
          icon={Eye}
          label="Total Views"
          value={form.viewCount.toLocaleString()}
        />
        <StatPill
          icon={BarChart2}
          label="Completion Rate"
          value={stats ? `${Math.round(stats.completionRate * 100)}%` : '—'}
        />
        <StatPill
          icon={Clock}
          label="Avg Fields Answered"
          value={stats
            ? `${Math.round(stats.avgFieldsAnswered)} / ${stats.totalFields}`
            : '—'}
        />
      </div>

      {/* ── Analytics error banner ─────────────────────────────── */}
      {anyAnalyticsError && (
        <div
          style={{
            background: 'rgba(239,68,68,0.08)',
            border:     '1px solid rgba(239,68,68,0.3)',
            padding:    '12px 16px',
            marginBottom:'20px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize:   '11px',
            color:      '#ef4444',
          }}
        >
          [WARN] Analytics data unavailable — some charts may be empty.
        </div>
      )}

      {/* ── Analytics grid ─────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{ gap: '16px', marginBottom: '16px' }}
      >
        {/* Health score */}
        {statsQuery.isLoading || healthQuery.isLoading ? (
          <Skeleton h={320} />
        ) : stats ? (
          <FormHealthScore score={score} stats={stats} />
        ) : null}

        {/* Insights */}
        {insightsQuery.isLoading ? (
          <Skeleton h={320} />
        ) : (
          <InsightCards insights={insightsQuery.data?.data ?? []} />
        )}
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{ gap: '16px', marginBottom: '16px' }}
      >
        {/* Completion funnel */}
        {completionQuery.isLoading ? (
          <Skeleton h={260} />
        ) : (
          <CompletionFunnel data={completionQuery.data?.data ?? []} />
        )}

        {/* Drop-off funnel */}
        {dropoffQuery.isLoading ? (
          <Skeleton h={260} />
        ) : (
          <DropoffFunnel data={dropoffQuery.data?.data ?? []} />
        )}
      </div>

      {/* Time series — full width */}
      {timeSeriesQuery.isLoading ? (
        <Skeleton h={280} />
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <TimeSeries
            data={timeSeriesQuery.data?.data ?? []}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
        </div>
      )}

      {/* Field breakdown — full width */}
      {dropoffQuery.isLoading ? (
        <Skeleton h={240} />
      ) : (
        <FieldBreakdown data={dropoffQuery.data?.data ?? []} />
      )}
        </div>

        <QRCodeModal
          isOpen={qrOpen}
          onClose={() => setQrOpen(false)}
          url={publicUrl}
          formTitle={form.title}
        />
        </>
      )}
    </AnimatePresence>
  );
}
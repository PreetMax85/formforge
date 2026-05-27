'use client';

import { use, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { trpc } from '~/trpc/client';
import {
  Inbox, ChevronDown, ChevronUp, Trash2,
  Mail, User, Clock, Download,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import LoadingScreen from '~/components/shared/LoadingScreen';

/* ── Types ────────────────────────────────────────────────────────── */
interface Answer {
  id:         string;
  responseId: string;
  fieldId:    string;
  fieldLabel: string;
  value:      string | string[];
  createdAt:  string;
}

interface Response {
  id:              string;
  formId:          string;
  respondentEmail: string | null;
  respondentName:  string | null;
  ipAddress:       string | null;
  emailCopySent:   boolean;
  completedAt:     string;
  createdAt:       string;
  answers:         Answer[];
}

/* ── Helpers ──────────────────────────────────────────────────────── */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month:  'short',
    day:    'numeric',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function formatValue(value: string | string[]): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value === 'true')  return 'Yes';
  if (value === 'false') return 'No';
  return value;
}

/* ── Answer display ───────────────────────────────────────────────── */
function AnswerRow({ answer, index }: { answer: Answer; index: number }) {
  return (
    <div
      style={{
        display:    'flex',
        gap:        '12px',
        padding:    '8px 12px',
        background: index % 2 === 0 ? '#1e1e1e' : '#252526',
        borderBottom: '1px solid #2a2a2a',
      }}
    >
      <span
        style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      '9px',
          color:         '#4b5563',
          width:         '80px',
          flexShrink:    0,
          paddingTop:    '2px',
          letterSpacing: '0.04em',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
        }}
        title={answer.fieldLabel}
      >
        {answer.fieldLabel}
      </span>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize:   '12px',
          color:      '#d4d4d4',
          flex:       1,
          lineHeight: 1.5,
        }}
      >
        {formatValue(answer.value)}
      </span>
    </div>
  );
}

/* ── Response row ─────────────────────────────────────────────────── */
function ResponseRow({
  response,
  onDelete,
  isDeleting,
}: {
  response:   Response;
  onDelete:   (id: string) => void;
  isDeleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border:       '1px solid #2a2a2a',
        marginBottom: '8px',
        opacity:      isDeleting ? 0.5 : 1,
        transition:   'opacity 0.2s',
      }}
    >
      {/* ── Header row ──────────────────────────────────────────── */}
      <div
        style={{
          display:       'flex',
          alignItems:    'center',
          gap:           '12px',
          padding:       '12px 16px',
          background:    '#141414',
          cursor:        'pointer',
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Respondent info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '3px' }}>
            {response.respondentName ? (
              <div className="flex items-center gap-1.5">
                <User size={11} style={{ color: '#569cd6', flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize:   '13px',
                    fontWeight: 500,
                    color:      '#d4d4d4',
                  }}
                >
                  {response.respondentName}
                </span>
              </div>
            ) : (
              <span
                style={{
                  fontFamily:    "'JetBrains Mono', monospace",
                  fontSize:      '11px',
                  color:         '#4b5563',
                  fontStyle:     'italic',
                }}
              >
                Anonymous
              </span>
            )}

            {response.respondentEmail && (
              <div className="flex items-center gap-1">
                <Mail size={10} style={{ color: '#6b7280' }} />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize:   '10px',
                    color:      '#6b7280',
                  }}
                >
                  {response.respondentEmail}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock size={10} style={{ color: '#4b5563' }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize:   '10px',
                  color:      '#4b5563',
                }}
              >
                {formatDate(response.createdAt)}
              </span>
            </div>

            <span
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '10px',
                color:         '#4b5563',
                background:    '#252526',
                padding:       '1px 6px',
                border:        '1px solid #2a2a2a',
              }}
            >
              {response.answers.length} answer{response.answers.length !== 1 ? 's' : ''}
            </span>

            {response.emailCopySent && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize:   '10px',
                  color:      '#4ec9b0',
                  background: 'rgba(78,201,176,0.08)',
                  padding:    '1px 6px',
                  border:     '1px solid rgba(78,201,176,0.2)',
                }}
              >
                copy sent
              </span>
            )}
          </div>
        </div>

        {/* Response ID */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize:   '9px',
            color:      '#374151',
          }}
        >
          {response.id.slice(0, 8)}
        </span>

        {/* Actions */}
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onDelete(response.id)}
            disabled={isDeleting}
            style={{
              background: 'transparent',
              border:     '1px solid transparent',
              color:      '#4b5563',
              cursor:     isDeleting ? 'not-allowed' : 'pointer',
              padding:    '4px',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            title="Delete response"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#4b5563';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Expand toggle */}
        <div style={{ color: '#4b5563', flexShrink: 0 }}>
          {expanded
            ? <ChevronUp size={14} />
            : <ChevronDown size={14} />}
        </div>
      </div>

      {/* ── Expanded answers ─────────────────────────────────────── */}
      {expanded && (
        <div style={{ borderTop: '1px solid #2a2a2a' }}>
          {/* Column headers */}
          <div
            style={{
              display:    'flex',
              gap:        '12px',
              padding:    '6px 12px',
              background: '#333333',
              borderBottom: '1px solid #2a2a2a',
            }}
          >
            <span
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '9px',
                color:         '#6b7280',
                width:         '80px',
                flexShrink:    0,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Field ID
            </span>
            <span
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '9px',
                color:         '#6b7280',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Answer
            </span>
          </div>

          {response.answers.length === 0 ? (
            <div
              style={{
                padding:    '16px 12px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize:   '11px',
                color:      '#374151',
              }}
            >
              No answers recorded.
            </div>
          ) : (
            response.answers.map((answer, i) => (
              <AnswerRow key={answer.id} answer={answer} index={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Delete confirmation ──────────────────────────────────────────── */
function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm();
  }

  return (
    <div
      style={{
        position:        'fixed',
        inset:           0,
        background:      'rgba(0,0,0,0.7)',
        zIndex:          50,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
      }}
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#252526',
          border:     '1px solid #3c3c3c',
          padding:    '28px 32px',
          maxWidth:   '360px',
          width:      '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontFamily:   "'Space Grotesk', sans-serif",
            fontSize:     '16px',
            fontWeight:   600,
            color:        '#d4d4d4',
            marginBottom: '10px',
          }}
        >
          Delete response?
        </h3>
        <p
          style={{
            fontFamily:   "'Inter', sans-serif",
            fontSize:     '13px',
            color:        '#6b7280',
            marginBottom: '24px',
            lineHeight:   1.6,
          }}
        >
          This will permanently remove the response and all its answers.
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   '12px',
              color:      '#9ca3af',
              background: 'transparent',
              border:     '1px solid #3c3c3c',
              padding:    '6px 16px',
              cursor:     'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   '12px',
              color:      '#fff',
              background: '#ef4444',
              border:     '1px solid #ef4444',
              padding:    '6px 16px',
              cursor:     'pointer',
              fontWeight: 700,
            }}
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: formId } = use(params);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingIds,     setDeletingIds]     = useState<Set<string>>(new Set());

  /* ── Infinite query ──────────────────────────────────────────── */
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.responses.list.useInfiniteQuery(
    { formId, limit: 50 },
    { getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined }
  );

  /* ── Delete mutation ─────────────────────────────────────────── */
  const utils = trpc.useUtils();
  const deleteMutation = trpc.responses.delete.useMutation({
    onMutate: (vars) => {
      setDeletingIds((prev) => new Set(prev).add(vars.id));
    },
    onSuccess: () => {
      toast.success('Response deleted.');
      void utils.responses.list.invalidate({ formId });
      void utils.forms.byId.invalidate({ id: formId });
      void utils.analytics.formStats.invalidate({ formId });
    },
    onError: (_, vars) => {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(vars.id);
        return next;
      });
    },
    onSettled: (_, __, vars) => {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(vars.id);
        return next;
      });
      setPendingDeleteId(null);
    },
  });

  function handleDeleteRequest(id: string) {
    setPendingDeleteId(id);
  }

  function handleDeleteConfirm() {
    if (!pendingDeleteId) return;
    deleteMutation.mutate({ id: pendingDeleteId });
  }

  const allResponses = data?.pages.flatMap(
    (p) => p.data.items as Response[]
  ) ?? [];

  const totalCount = allResponses.length;

  /* ── CSV export (client-side) ────────────────────────────────── */
  function exportCsv() {
    if (allResponses.length === 0) return;

    const headers = ['Response ID', 'Name', 'Email', 'Date', 'Answers'];
    const rows = allResponses.map((r) => [
      r.id,
      r.respondentName  ?? '',
      r.respondentEmail ?? '',
      formatDate(r.createdAt),
      r.answers.map((a) => `${a.fieldId.slice(0, 8)}: ${formatValue(a.value)}`).join(' | '),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `responses-${formId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── 4-state async pattern ───────────────────────────────────── */
  if (error) {
    return (
      <div
        style={{
          padding:    '24px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize:   '12px',
          color:      '#ef4444',
        }}
      >
        [ERROR] {error.message}
      </div>
    );
  }

  if (allResponses.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ padding: '80px 24px', textAlign: 'center' }}
      >
        <Inbox size={36} style={{ color: '#3c3c3c', marginBottom: '16px' }} />
        <p
          style={{
            fontFamily:   "'JetBrains Mono', monospace",
            fontSize:     '13px',
            color:        '#4b5563',
            marginBottom: '6px',
          }}
        >
          No assets found in this scene.
        </p>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize:   '11px',
            color:      '#374151',
          }}
        >
          Share your form to start collecting responses.
        </p>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <div key="loading" style={{ padding: '24px' }}>
          <LoadingScreen variant="inline" message="Fetching responses..." />
        </div>
      ) : (
        <>
          <div style={{ padding: '24px' }}>

        {/* ── Toolbar ────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}
        >
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '11px',
                color:         '#9ca3af',
                letterSpacing: '0.06em',
              }}
            >
              {totalCount.toLocaleString()} response{totalCount !== 1 ? 's' : ''}
              {hasNextPage && '+'}
            </span>
          </div>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5"
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '11px',
              color:         '#9ca3af',
              background:    'transparent',
              border:        '1px solid #3c3c3c',
              padding:       '5px 12px',
              cursor:        'pointer',
              letterSpacing: '0.06em',
              transition:    'border-color 0.15s, color 0.15s',
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
            <Download size={12} />
            Export CSV
          </button>
        </div>

        {/* ── Response list ──────────────────────────────────────── */}
        {allResponses.map((response) => (
          <ResponseRow
            key={response.id}
            response={response}
            onDelete={handleDeleteRequest}
            isDeleting={deletingIds.has(response.id)}
          />
        ))}

        {/* ── Load more ──────────────────────────────────────────── */}
        {hasNextPage && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '11px',
                color:         isFetchingNextPage ? '#4b5563' : '#569cd6',
                background:    'transparent',
                border:        '1px solid #3c3c3c',
                padding:       '8px 24px',
                cursor:        isFetchingNextPage ? 'not-allowed' : 'pointer',
                letterSpacing: '0.06em',
                transition:    'border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isFetchingNextPage)
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#569cd6';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#3c3c3c';
              }}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more responses'}
            </button>
          </div>
        )}
      </div>

      {/* ── Delete confirm modal ──────────────────────────────────── */}
      {pendingDeleteId && (
        <DeleteConfirmModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
        </>
      )}
    </AnimatePresence>
  );
}
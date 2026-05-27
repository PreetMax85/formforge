'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, BarChart2, Globe } from 'lucide-react';
import { trpc } from '~/trpc/client';

/* ── Theme metadata for badges ───────────────────────────────────── */
const THEME_META: Record<string, { label: string; color: string; bg: string }> = {
  'default':              { label: 'Default',        color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
  'ghost-of-tsushima':   { label: 'Ghost of Tsushima', color: '#C68B9D', bg: 'rgba(198,139,157,0.1)' },
  'jujutsu-kaisen':      { label: 'Jujutsu Kaisen',  color: '#7c3aed', bg: 'rgba(124,58,237,0.1)'  },
  'karan-aujla-concert': { label: 'Karan Aujla',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  'cyberpunk':           { label: 'Cyberpunk',        color: '#ff2d78', bg: 'rgba(255,45,120,0.1)'  },
  'matrix':              { label: 'Matrix',           color: '#00cc33', bg: 'rgba(0,204,51,0.1)'    },
  'synthwave':           { label: 'Synthwave',        color: '#ff79c6', bg: 'rgba(255,121,198,0.1)' },
  'minimal':             { label: 'Minimal',          color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
};

function getThemeMeta(theme: string) {
  return THEME_META[theme] ?? THEME_META['default']!;
}

/* ── Theme filter pills ───────────────────────────────────────────── */
const THEME_FILTERS = [
  { value: undefined,              label: 'All themes'      },
  { value: 'ghost-of-tsushima',   label: 'Ghost of Tsushima' },
  { value: 'jujutsu-kaisen',      label: 'Jujutsu Kaisen'  },
  { value: 'karan-aujla-concert', label: 'Karan Aujla'     },
  { value: 'cyberpunk',           label: 'Cyberpunk'       },
  { value: 'matrix',              label: 'Matrix'          },
  { value: 'synthwave',           label: 'Synthwave'       },
  { value: 'minimal',             label: 'Minimal'         },
] as const;

type ThemeFilter = (typeof THEME_FILTERS)[number]['value'];

/* ── Form card ───────────────────────────────────────────────────── */
interface FormCardProps {
  form: {
    id:            string;
    slug:          string;
    title:         string;
    description:   string | null;
    theme:         string;
    responseCount: number;
    publishedAt?:  unknown;
  };
}

function FormCard({ form }: FormCardProps) {
  const meta = getThemeMeta(form.theme);

  return (
    <Link
      href={`/f/${form.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          background:  '#141414',
          border:      '1px solid #2a2a2a',
          padding:     '24px',
          height:      '100%',
          transition:  'border-color 0.15s, transform 0.15s',
          cursor:      'pointer',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = meta.color + '60';
          el.style.transform   = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = '#2a2a2a';
          el.style.transform   = 'translateY(0)';
        }}
      >
        {/* Theme badge */}
        <span
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '10px',
            color:         meta.color,
            background:    meta.bg,
            padding:       '2px 8px',
            letterSpacing: '0.06em',
            display:       'inline-block',
            marginBottom:  '14px',
          }}
        >
          {meta.label}
        </span>

        {/* Title */}
        <h3
          style={{
            fontFamily:   "'Space Grotesk', sans-serif",
            fontSize:     '16px',
            fontWeight:   600,
            color:        '#d4d4d4',
            marginBottom: '8px',
            lineHeight:   1.3,
          }}
        >
          {form.title}
        </h3>

        {/* Description */}
        {form.description && (
          <p
            style={{
              fontFamily:   "'Inter', sans-serif",
              fontSize:     '13px',
              color:        '#6b7280',
              lineHeight:   1.6,
              marginBottom: '16px',
              display:      '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow:     'hidden',
            }}
          >
            {form.description}
          </p>
        )}

        {/* Footer row */}
        <div
          className="flex items-center justify-between"
          style={{ marginTop: 'auto', paddingTop: '16px' }}
        >
          <div className="flex items-center gap-3">
            {/* Response count */}
            <div className="flex items-center gap-1.5">
              <BarChart2 size={11} style={{ color: '#4b5563' }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize:   '11px',
                  color:      '#4b5563',
                }}
              >
                {form.responseCount.toLocaleString()} responses
              </span>
            </div>
          </div>

          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   '11px',
              color:      meta.color,
              display:    'flex',
              alignItems: 'center',
              gap:        '3px',
            }}
          >
            Fill form
            <ChevronRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Empty state ─────────────────────────────────────────────────── */
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 text-center"
      style={{ gridColumn: '1 / -1' }}
    >
      <Globe size={32} style={{ color: '#3c3c3c', marginBottom: '16px' }} />
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize:   '13px',
          color:      '#4b5563',
          marginBottom:'6px',
        }}
      >
        {hasSearch
          ? 'No forms match your search — try a different keyword or theme.'
          : "This corner of the multiverse is quiet... for now. Be the first to forge something here."}
      </p>
      {!hasSearch && (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#374151' }}>
          Create a form in your dashboard and publish it to light up this grid.
        </p>
      )}
    </div>
  );
}

/* ── Skeleton card ───────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      style={{
        background: '#141414',
        border:     '1px solid #2a2a2a',
        padding:    '24px',
        height:     '180px',
      }}
    >
      {[60, 80, 100, 50].map((w, i) => (
        <div
          key={i}
          style={{
            height:       i === 0 ? '16px' : i === 1 ? '20px' : '12px',
            width:        `${w}%`,
            background:   '#252526',
            marginBottom: '12px',
            animation:    'skeleton-pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function ExplorePage() {
  const [search,       setSearch]       = useState('');
  const [activeTheme,  setActiveTheme]  = useState<ThemeFilter>(undefined);
  const [searchInput,  setSearchInput]  = useState('');

  const { data, isLoading, isFetching, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.forms.explore.useInfiniteQuery(
      {
        search: search || undefined,
        theme:  activeTheme,
        limit:  20,
      },
      {
        getNextPageParam: (lastPage) =>
          lastPage.data.nextCursor ?? undefined,
      }
    );

  const forms = data?.pages.flatMap((p) => p.data.items) ?? [];

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  return (
    <main
      style={{
        background: '#0e0e0e',
        color:      '#d4d4d4',
        minHeight:  '100vh',
        paddingTop: '56px',
      }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: '1px solid #2a2a2a',
          padding:      '48px 24px 32px',
          background:   '#0a0a0a',
        }}
      >
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <p
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '11px',
              color:         '#569cd6',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom:  '12px',
            }}
          >
            // Explore
          </p>
          <h1
            style={{
              fontFamily:   "'Space Grotesk', sans-serif",
              fontSize:     'clamp(28px, 4vw, 40px)',
              fontWeight:   700,
              color:        '#d4d4d4',
              marginBottom: '24px',
            }}
          >
            Public forms.
          </h1>

          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            style={{ maxWidth: '480px', position: 'relative' }}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left:     '14px',
                top:      '50%',
                transform:'translateY(-50%)',
                color:    '#4b5563',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search forms..."
              style={{
                width:      '100%',
                padding:    '10px 14px 10px 40px',
                background: '#141414',
                border:     '1px solid #3c3c3c',
                color:      '#d4d4d4',
                fontSize:   '14px',
                fontFamily: "'Inter', sans-serif",
                outline:    'none',
              }}
              onFocus={(e)  => (e.currentTarget.style.borderColor = '#569cd6')}
              onBlur={(e)   => (e.currentTarget.style.borderColor = '#3c3c3c')}
            />
          </form>
        </div>
      </section>

      {/* ── Theme filter pills ─────────────────────────────────── */}
      <section style={{ padding: '20px 24px', borderBottom: '1px solid #1a1a1a' }}>
        <div
          style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}
        >
          {THEME_FILTERS.map((f) => {
            const isActive = activeTheme === f.value;
            const meta     = f.value ? getThemeMeta(f.value) : null;
            return (
              <button
                key={f.label}
                onClick={() => setActiveTheme(f.value as ThemeFilter)}
                style={{
                  fontFamily:    "'JetBrains Mono', monospace",
                  fontSize:      '11px',
                  padding:       '4px 12px',
                  background:    isActive ? (meta?.bg ?? 'rgba(86,156,214,0.1)') : 'transparent',
                  border:        `1px solid ${isActive ? (meta?.color ?? '#569cd6') : '#2a2a2a'}`,
                  color:         isActive ? (meta?.color ?? '#569cd6') : '#6b7280',
                  cursor:        'pointer',
                  transition:    'all 0.15s',
                  letterSpacing: '0.04em',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#3c3c3c';
                    (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a';
                    (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                  }
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Grid ──────────────────────────────────────────────── */}
      <section style={{ padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>

          {/* Error state */}
          {error && (
            <div
              style={{
                padding:    '16px',
                background: 'rgba(239,68,68,0.08)',
                border:     '1px solid rgba(239,68,68,0.3)',
                color:      '#ef4444',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize:   '12px',
                marginBottom:'24px',
              }}
            >
              [ERROR] {error.message}
            </div>
          )}

          {/* Count */}
          {!isLoading && !isFetching && !error && (
            <p
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '11px',
                color:         '#4b5563',
                marginBottom:  '20px',
                letterSpacing: '0.04em',
              }}
            >
              {forms.length} form{forms.length !== 1 ? 's' : ''} found
              {search ? ` for "${search}"` : ''}
            </p>
          )}

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{ gap: '16px' }}
          >
            {/* Skeleton loading */}
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

            {/* Empty state */}
            {!isLoading && !error && forms.length === 0 && (
              <EmptyState hasSearch={!!search} />
            )}

            {/* Form cards */}
            {forms.map((form) => (
              <FormCard key={form.id} form={form} />
            ))}
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                style={{
                  fontFamily:    "'JetBrains Mono', monospace",
                  fontSize:      '12px',
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
                {isFetchingNextPage ? 'Loading...' : 'Load more forms'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
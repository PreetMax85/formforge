'use client';

import { useEffect, useState } from 'react';
import { Check, CloudOff, ExternalLink, Loader2, RotateCcw, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { SaveStatus } from '~/lib/draft/saveController';

interface DraftStatusBarProps {
  status: SaveStatus;
  statusMessage: string | null;
  savedAt: Date | null;
  hasUnpublishedChanges: boolean;
  hasBeenPublished: boolean;
  liveUrl: string | null;
  onDiscard: () => void;
  onReload: () => void;
}

function secondsAgo(date: Date | null, now: number): string {
  if (!date) return '';
  const s = Math.max(0, Math.round((now - date.getTime()) / 1000));
  return s < 5 ? 'just now' : s < 60 ? `${s} s ago` : `${Math.round(s / 60)} min ago`;
}

/** Autosave status, plus Discard changes and View live, for the builder. */
export default function DraftStatusBar(props: DraftStatusBarProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const label = {
    saved:    <><Check size={14} aria-hidden /> Saved {secondsAgo(props.savedAt, now)}</>,
    saving:   <><Loader2 size={14} aria-hidden className="animate-spin motion-reduce:animate-none" /> Saving…</>,
    unsaved:  <>Unsaved changes</>,
    offline:  <><CloudOff size={14} aria-hidden /> Offline — changes kept on this device</>,
    conflict: <><TriangleAlert size={14} aria-hidden /> {props.statusMessage}</>,
    error:    <><TriangleAlert size={14} aria-hidden /> {props.statusMessage ?? "Couldn't save"}</>,
  }[props.status];

  function confirmDiscard() {
    toast('Discard changes since the last publish?', {
      action: { label: 'Discard', onClick: props.onDiscard },
    });
  }

  return (
    <div className="flex items-center gap-3 text-xs" style={{ color: '#d4d4d4' }}>
      <span role="status" aria-live="polite" className="flex items-center gap-1">{label}</span>
      {props.status === 'conflict' && (
        <button type="button" onClick={props.onReload} className="underline">Reload</button>
      )}
      {props.hasBeenPublished && props.hasUnpublishedChanges && (
        <button type="button" onClick={confirmDiscard} className="flex items-center gap-1 underline">
          <RotateCcw size={14} aria-hidden /> Discard changes
        </button>
      )}
      {props.liveUrl && (
        <a href={props.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline">
          View live <ExternalLink size={14} aria-hidden />
        </a>
      )}
    </div>
  );
}

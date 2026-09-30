export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'offline' | 'conflict' | 'error';

export type SaveOutcome =
  | { kind: 'saved'; revision: number }
  | { kind: 'conflict' }
  | { kind: 'network' }
  | { kind: 'rejected'; message: string };

export interface DraftSaveControllerOptions<C> {
  initialRevision: number;
  save: (content: C, baseRevision: number) => Promise<SaveOutcome>;
  onChange: (state: { status: SaveStatus; revision: number; message: string | null }) => void;
  debounceMs?: number;
  maxWaitMs?: number;
  retryBaseMs?: number;
  retryMaxMs?: number;
}

/**
 * Decides when a draft is saved: 800 ms after the last edit (at least every
 * 5 s while edits keep coming, and at most once per 5 s however fast saves
 * return), one request at a time, retrying network
 * failures with backoff, and stopping for good on a conflict. It knows
 * nothing about React or HTTP; `save` does the request.
 */
export class DraftSaveController<C> {
  private readonly opts: Required<DraftSaveControllerOptions<C>>;
  private revision: number;
  private status: SaveStatus = 'saved';
  private latest: C | null = null;
  private dirty = false;
  private inFlight = false;
  private firstUnsavedAt: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay: number;
  private waiters: Array<(s: SaveStatus) => void> = [];
  private disposed = false;
  /** Bumped by every edit, so a finished save can tell whether newer edits arrived while it ran. */
  private editSeq = 0;
  /** Bumped by reset(), so a save that was in flight across a reset is ignored when it finishes. */
  private epoch = 0;

  constructor(options: DraftSaveControllerOptions<C>) {
    this.opts = { debounceMs: 800, maxWaitMs: 5000, retryBaseMs: 2000, retryMaxMs: 30_000, ...options };
    this.revision = options.initialRevision;
    this.retryDelay = this.opts.retryBaseMs;
  }

  /** Records new content and schedules a save. */
  edit(content: C): void {
    if (this.disposed || this.status === 'conflict') return;
    this.latest = content;
    this.dirty = true;
    this.editSeq += 1;
    this.firstUnsavedAt ??= Date.now();
    if (!this.inFlight && this.status !== 'offline') this.setStatus('unsaved', null);
    if (this.status === 'offline') return; // the retry timer will pick it up
    const waited = Date.now() - this.firstUnsavedAt;
    this.schedule(Math.max(0, Math.min(this.opts.debounceMs, this.opts.maxWaitMs - waited)));
  }

  /** Saves pending changes now and resolves once nothing is in flight. */
  flush(): Promise<SaveStatus> {
    if (this.disposed || this.status === 'conflict') return Promise.resolve(this.status);
    if (!this.dirty && !this.inFlight) return Promise.resolve(this.status);
    const done = new Promise<SaveStatus>((resolve) => this.waiters.push(resolve));
    if (!this.inFlight) {
      this.clearTimer();
      void this.run();
    }
    return done;
  }

  /** Adopts a revision from outside (after discard or reload); drops pending edits. */
  reset(revision: number): void {
    this.clearTimer();
    this.epoch += 1;
    this.revision = revision;
    this.dirty = false;
    this.latest = null;
    this.firstUnsavedAt = null;
    this.retryDelay = this.opts.retryBaseMs;
    this.setStatus('saved', null);
    this.resolveWaiters();
  }

  /** The revision the next save will be based on. */
  getRevision(): number { return this.revision; }

  /** The current save status. */
  getStatus(): SaveStatus { return this.status; }

  /** True while there are unsaved edits or a save is in flight. */
  hasPendingChanges(): boolean { return this.dirty || this.inFlight; }

  /** Stops all timers; later edits are ignored and pending flush() calls resolve. */
  dispose(): void {
    this.disposed = true;
    this.clearTimer();
    this.resolveWaiters();
  }

  private schedule(ms: number): void {
    this.clearTimer();
    this.timer = setTimeout(() => { this.timer = null; void this.run(); }, ms);
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private async run(): Promise<void> {
    if (this.disposed || this.inFlight || !this.dirty || this.latest === null) return;
    const snapshot = this.latest;
    const epoch = this.epoch;
    const seqAtStart = this.editSeq;
    this.dirty = false;
    this.inFlight = true;
    this.setStatus('saving', null);

    let outcome: SaveOutcome;
    try {
      outcome = await this.opts.save(snapshot, this.revision);
    } catch {
      outcome = { kind: 'rejected', message: 'Saving failed unexpectedly.' };
    }
    this.inFlight = false;
    if (this.disposed) return;

    if (epoch !== this.epoch) {
      // reset() ran while this save was in flight: its result describes a draft we no longer track.
      if (this.dirty) void this.run();
      else this.settle();
      return;
    }

    switch (outcome.kind) {
      case 'saved':
        this.revision = outcome.revision;
        this.retryDelay = this.opts.retryBaseMs;
        if (this.dirty) {
          // Edits arrived during the save. Go back through the scheduler with a
          // fresh max-wait window: saving again at once made the cadence one
          // request per round trip while someone types, which spent the API's
          // rate limit in about a minute.
          this.setStatus('unsaved', null);
          if (this.waiters.length > 0) {
            // flush() is waiting (leaving the page, publishing): save now.
            this.clearTimer();
            void this.run();
            return;
          }
          this.firstUnsavedAt = Date.now();
          this.schedule(this.opts.debounceMs);
          return;
        }
        this.firstUnsavedAt = null;
        this.setStatus('saved', null);
        break;
      case 'network':
        this.dirty = true;
        this.setStatus('offline', null);
        this.schedule(this.retryDelay);
        this.retryDelay = Math.min(this.retryDelay * 2, this.opts.retryMaxMs);
        break;
      case 'conflict':
        this.clearTimer();
        this.firstUnsavedAt = null;
        this.setStatus('conflict', 'This form was changed in another tab.');
        break;
      case 'rejected':
        this.dirty = true;
        // Restart the max-wait clock, or every later edit would save at once (0 ms debounce).
        this.firstUnsavedAt = null;
        if (this.editSeq !== seqAtStart) {
          // Newer edits arrived during the failed save: they are the "next edit", so try again.
          this.setStatus('unsaved', null);
          this.schedule(this.opts.debounceMs);
          return;
        }
        this.setStatus('error', outcome.message);
        break; // wait for the next edit
    }
    this.settle();
  }

  private settle(): void {
    const stillWorking = this.dirty && this.status !== 'error' && this.status !== 'offline' && this.status !== 'conflict';
    if (this.inFlight || stillWorking) return;
    this.resolveWaiters();
  }

  private resolveWaiters(): void {
    const waiters = this.waiters;
    this.waiters = [];
    for (const w of waiters) w(this.status);
  }

  private setStatus(status: SaveStatus, message: string | null): void {
    this.status = status;
    this.opts.onChange({ status, revision: this.revision, message });
  }
}

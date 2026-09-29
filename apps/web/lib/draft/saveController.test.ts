import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DraftSaveController, type SaveOutcome, type SaveStatus } from './saveController';

type Call = { content: string; base: number; resolve: (o: SaveOutcome) => void };

function setup() {
  const calls: Call[] = [];
  const statuses: SaveStatus[] = [];
  const controller = new DraftSaveController<string>({
    initialRevision: 1,
    save: (content, base) => new Promise<SaveOutcome>((resolve) => calls.push({ content, base, resolve })),
    onChange: (s) => statuses.push(s.status),
  });
  return { controller, calls, statuses };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('DraftSaveController', () => {
  it('debounces edits into one save', async () => {
    const { controller, calls } = setup();
    controller.edit('a'); controller.edit('ab'); controller.edit('abc');
    expect(controller.getStatus()).toBe('unsaved');
    await vi.advanceTimersByTimeAsync(799);
    expect(calls).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toEqual([expect.objectContaining({ content: 'abc', base: 1 })]);
  });

  it('saves at least every 5 s while typing continues', async () => {
    const { controller, calls } = setup();
    for (let t = 0; t < 5000; t += 500) { controller.edit(`v${t}`); await vi.advanceTimersByTimeAsync(500); }
    expect(calls.length).toBe(1);
  });

  it('never sends two saves at once and follows up with the newer content', async () => {
    const { controller, calls } = setup();
    controller.edit('one');
    await vi.advanceTimersByTimeAsync(800);
    controller.edit('two');
    await vi.advanceTimersByTimeAsync(800);
    expect(calls).toHaveLength(1);
    calls[0]!.resolve({ kind: 'saved', revision: 2 });
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(2);
    expect(calls[1]).toEqual(expect.objectContaining({ content: 'two', base: 2 }));
    calls[1]!.resolve({ kind: 'saved', revision: 3 });
    await vi.advanceTimersByTimeAsync(0);
    expect(controller.getStatus()).toBe('saved');
    expect(controller.getRevision()).toBe(3);
  });

  it('goes offline on a network error and retries with backoff', async () => {
    const { controller, calls } = setup();
    controller.edit('x');
    await vi.advanceTimersByTimeAsync(800);
    calls[0]!.resolve({ kind: 'network' });
    await vi.advanceTimersByTimeAsync(0);
    expect(controller.getStatus()).toBe('offline');
    await vi.advanceTimersByTimeAsync(1999);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2);
    calls[1]!.resolve({ kind: 'network' });
    await vi.advanceTimersByTimeAsync(4000);
    expect(calls).toHaveLength(3);
  });

  it('stops on conflict and does not save again', async () => {
    const { controller, calls } = setup();
    controller.edit('x');
    await vi.advanceTimersByTimeAsync(800);
    calls[0]!.resolve({ kind: 'conflict' });
    await vi.advanceTimersByTimeAsync(0);
    expect(controller.getStatus()).toBe('conflict');
    controller.edit('y');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toHaveLength(1);
  });

  it('reports a rejected save as error and retries only after the next edit', async () => {
    const { controller, calls } = setup();
    controller.edit('x');
    await vi.advanceTimersByTimeAsync(800);
    calls[0]!.resolve({ kind: 'rejected', message: 'bad' });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(controller.getStatus()).toBe('error');
    expect(calls).toHaveLength(1);
    controller.edit('y');
    await vi.advanceTimersByTimeAsync(800);
    expect(calls).toHaveLength(2);
  });

  it('flush saves immediately and resolves with the final status', async () => {
    const { controller, calls } = setup();
    controller.edit('x');
    const done = controller.flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(1);
    calls[0]!.resolve({ kind: 'saved', revision: 2 });
    await expect(done).resolves.toBe('saved');
  });

  it('flush with nothing pending resolves at once', async () => {
    const { controller } = setup();
    await expect(controller.flush()).resolves.toBe('saved');
  });

  it('flush resolves as conflict when a conflict arrives while newer edits were pending', async () => {
    const { controller, calls } = setup();
    controller.edit('one');
    await vi.advanceTimersByTimeAsync(800);
    controller.edit('two');
    const done = controller.flush();
    calls[0]!.resolve({ kind: 'conflict' });
    await expect(done).resolves.toBe('conflict');
    await expect(controller.flush()).resolves.toBe('conflict');
    expect(calls).toHaveLength(1);
  });

  it('retries after a rejected save when an edit arrived while it was in flight', async () => {
    const { controller, calls } = setup();
    controller.edit('one');
    await vi.advanceTimersByTimeAsync(800);
    controller.edit('two');
    calls[0]!.resolve({ kind: 'rejected', message: 'bad' });
    await vi.advanceTimersByTimeAsync(0);
    expect(controller.getStatus()).toBe('unsaved');
    await vi.advanceTimersByTimeAsync(800);
    expect(calls).toHaveLength(2);
    expect(calls[1]).toEqual(expect.objectContaining({ content: 'two' }));
  });

  it('treats a thrown save as a rejected save and frees the single-flight slot', async () => {
    const statuses: SaveStatus[] = [];
    let attempts = 0;
    const controller = new DraftSaveController<string>({
      initialRevision: 1,
      save: () => { attempts += 1; return Promise.reject(new Error('boom')); },
      onChange: (s) => statuses.push(s.status),
    });
    controller.edit('x');
    await vi.advanceTimersByTimeAsync(800);
    expect(controller.getStatus()).toBe('error');
    expect(controller.hasPendingChanges()).toBe(true);
    controller.edit('y');
    await vi.advanceTimersByTimeAsync(800);
    expect(attempts).toBe(2);
  });

  it('flush while debounced saves at once and cancels the timer', async () => {
    const { controller, calls } = setup();
    controller.edit('x');
    await vi.advanceTimersByTimeAsync(300);
    void controller.flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(1);
    calls[0]!.resolve({ kind: 'saved', revision: 2 });
    await vi.advanceTimersByTimeAsync(5000);
    expect(calls).toHaveLength(1);
  });

  it('ignores the result of a save that was in flight across reset()', async () => {
    const { controller, calls } = setup();
    controller.edit('x');
    await vi.advanceTimersByTimeAsync(800);
    controller.reset(7);
    calls[0]!.resolve({ kind: 'saved', revision: 2 });
    await vi.advanceTimersByTimeAsync(0);
    expect(controller.getRevision()).toBe(7);
    expect(controller.getStatus()).toBe('saved');
    expect(controller.hasPendingChanges()).toBe(false);
  });

  it('dispose clears timers and resolves pending flushes', async () => {
    const { controller, calls } = setup();
    controller.edit('x');
    controller.dispose();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    controller.edit('y');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toHaveLength(0);
  });

  it('dispose resolves a flush that is waiting on an in-flight save', async () => {
    const { controller, calls } = setup();
    controller.edit('x');
    const done = controller.flush();
    await vi.advanceTimersByTimeAsync(0);
    controller.dispose();
    await expect(done).resolves.toBe('saving');
    calls[0]!.resolve({ kind: 'saved', revision: 2 });
  });
});

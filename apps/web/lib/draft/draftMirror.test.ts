import { describe, it, expect, beforeEach } from 'vitest';
import { writeMirror, readMirror, clearMirror } from './draftMirror';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as unknown as { sessionStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> }).sessionStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => void store.set(k, v),
    removeItem: (k) => void store.delete(k),
  };
});

const content = { title: 'T', description: null, theme: 'default' as const, thankYouTitle: null, thankYouMessage: null, fields: [] };

describe('draft mirror', () => {
  it('offers edits made on top of the current server revision', () => {
    writeMirror('f', { baseRevision: 3, content });
    expect(readMirror('f', 3)).toEqual({ baseRevision: 3, content });
  });
  it('drops a mirror based on an older revision', () => {
    writeMirror('f', { baseRevision: 2, content });
    expect(readMirror('f', 3)).toBeNull();
    expect(store.size).toBe(0);
  });
  it('clears', () => {
    writeMirror('f', { baseRevision: 3, content });
    clearMirror('f');
    expect(readMirror('f', 3)).toBeNull();
  });
  it('ignores corrupt data', () => {
    store.set('formforge:draft:f', '{not json');
    expect(readMirror('f', 3)).toBeNull();
  });
  it('survives storage that throws (private windows)', () => {
    (globalThis as unknown as { sessionStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> }).sessionStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(() => writeMirror('f', { baseRevision: 3, content })).not.toThrow();
    expect(readMirror('f', 3)).toBeNull();
    expect(() => clearMirror('f')).not.toThrow();
  });
});

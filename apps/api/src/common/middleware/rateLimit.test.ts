import { describe, it, expect } from 'vitest';
import { isServiceBindingCall } from './rateLimit';

describe('isServiceBindingCall', () => {
  it('recognises the internal host Vercel uses for service bindings', () => {
    expect(isServiceBindingCall({ headers: { host: 'api.786b4f6352.services.vercel-infra.com' } })).toBe(true);
  });

  it('treats public hosts as ordinary visitor traffic', () => {
    expect(isServiceBindingCall({ headers: { host: 'formforge.jdevs.codes' } })).toBe(false);
    expect(isServiceBindingCall({ headers: { host: 'formforge-abc123.vercel.app' } })).toBe(false);
    expect(isServiceBindingCall({ headers: { host: 'services.vercel-infra.com.evil.example' } })).toBe(false);
  });

  it('ignores X-Forwarded-Host, which a client controls', () => {
    expect(isServiceBindingCall({
      headers: { host: 'formforge.jdevs.codes', 'x-forwarded-host': 'api.x.services.vercel-infra.com' },
    })).toBe(false);
  });
});

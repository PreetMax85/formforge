import { describe, it, expect } from 'vitest';
import { rotatedSessionExpiry } from './auth.service';
import { AUTH_CONSTANTS } from './auth.constants';

describe('rotatedSessionExpiry', () => {
  const now = new Date('2026-09-27T12:00:00Z');

  it('ends a rotated session after the grace period, not at once', () => {
    const sevenDaysLater = new Date(now.getTime() + 7 * 86_400_000);
    expect(rotatedSessionExpiry(sevenDaysLater, now).getTime())
      .toBe(now.getTime() + AUTH_CONSTANTS.ROTATION_GRACE_MS);
  });

  it('never extends a session that already ends sooner', () => {
    // A token already rotated once and used again inside its grace period
    const tenSecondsLater = new Date(now.getTime() + 10_000);
    expect(rotatedSessionExpiry(tenSecondsLater, now)).toEqual(tenSecondsLater);
  });
});

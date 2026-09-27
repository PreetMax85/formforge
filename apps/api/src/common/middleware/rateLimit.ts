import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

// Tiered rate limiting strategy with cascading defense:
// globalLimiter → apiWriteLimiter → submissionLimiter
// viewLimiter is a separate, more lenient limiter for view-count
// increments so analytics aren't skewed by the strict submission cap.

/**
 * True when the request came from our own Next.js server over a Vercel
 * service binding (server-side rendering of public forms and the dashboard's
 * session check). Those calls all arrive from the web function's single IP,
 * so counting them per IP would put every visitor in one bucket.
 *
 * Binding calls use an internal *.services.vercel-infra.com host, which does
 * not resolve publicly, and Vercel's edge routes public traffic by Host, so a
 * visitor cannot send one. Verified on a preview deployment, September 2026.
 */
export function isServiceBindingCall(req: Pick<Request, 'headers'>): boolean {
  // Read the Host header itself: with `trust proxy` on, req.hostname would
  // come from X-Forwarded-Host, which a client can set.
  const host = (req.headers.host ?? '').split(':')[0] ?? '';
  return host.endsWith('.services.vercel-infra.com');
}

export const globalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  skip:            isServiceBindingCall,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many requests. Please try again later.' },
});

export const apiWriteLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many requests. Please try again later.' },
});

export const submissionLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many submissions. Please try again later.' },
});

export const viewLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             60,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many requests. Please try again later.' },
});

export const passwordResetLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             3,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many password reset attempts. Try again in an hour.' },
});

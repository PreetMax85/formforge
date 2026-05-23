import rateLimit from 'express-rate-limit';

// Tiered rate limiting strategy with cascading defense:
// globalLimiter → apiWriteLimiter → submissionLimiter

export const globalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
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

export const passwordResetLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             3,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many password reset attempts. Try again in an hour.' },
});

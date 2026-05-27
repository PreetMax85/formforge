import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '@repo/shared';
import { logger } from '../logger';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
    });
    return;
  }
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error({ err }, '[ApiError 5xx]');
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  const pgCode = (err as { code?: string }).code;
  if (pgCode === '23505') {
    res.status(409).json({ success: false, error: 'Already exists.' });
    return;
  }
  if (pgCode === '23503') {
    res.status(400).json({ success: false, error: 'Invalid reference.' });
    return;
  }
  logger.error({ err }, '[Unhandled Error]');
  res.status(500).json({ success: false, error: 'Internal Server Error' });
};

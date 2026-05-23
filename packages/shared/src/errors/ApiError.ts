/**
 * Shared API error class used in both frontend and backend.
 * Every error thrown by the API must be an instance of this class.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest   = (msg = 'Bad request')          => new ApiError(400, msg);
  static unauthorized = (msg = 'Unauthorized')          => new ApiError(401, msg);
  static forbidden    = (msg = 'Forbidden')             => new ApiError(403, msg);
  static notFound     = (msg = 'Not found')             => new ApiError(404, msg);
  static conflict     = (msg = 'Conflict')              => new ApiError(409, msg);
  static tooMany      = (msg = 'Too many requests')     => new ApiError(429, msg);
  static internal     = (msg = 'Internal Server Error') => new ApiError(500, msg, false);
}

import { NextFunction, Request, Response } from 'express';
import { isProd } from '../config/env';
import { ApiError } from '../utils/ApiError';

interface PgError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
}

/** Map PostgreSQL constraint violations to meaningful API errors. */
function translatePgError(err: PgError): ApiError | null {
  switch (err.code) {
    case '23505': // unique_violation
      if (err.constraint === 'uq_active_allocation')
        return ApiError.conflict('This asset already has an active allocation');
      if (err.constraint === 'uq_open_transfer')
        return ApiError.conflict('This asset already has an open transfer request');
      return ApiError.conflict('A record with the same unique value already exists');
    case '23P01': // exclusion_violation (booking overlap)
      return ApiError.conflict('This time slot overlaps an existing confirmed booking');
    case '23503': // foreign_key_violation
      return ApiError.conflict('Operation blocked: the record is referenced by other data');
    case '23514': // check_violation
      return ApiError.badRequest('Value violates a database constraint');
    default:
      return null;
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route ${req.method} ${req.path}`));
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const apiError =
    err instanceof ApiError
      ? err
      : (translatePgError(err as PgError) ??
        new ApiError(500, isProd ? 'Internal server error' : err.message, 'INTERNAL_ERROR'));

  if (apiError.statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.path}`, err);
  }

  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  });
}

import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const windowMs = env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;

/** Global API limiter. */
export const apiLimiter = rateLimit({
  windowMs,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' } },
});

/** Stricter limiter for credential endpoints (brute-force protection). */
export const authLimiter = rateLimit({
  windowMs,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts' } },
});

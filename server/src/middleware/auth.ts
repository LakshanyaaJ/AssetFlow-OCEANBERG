import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/crypto';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number; role: string; roleId: number };
  }
}

/** Verifies the Bearer access token and attaches req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized());
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role, roleId: payload.roleId };
    return next();
  } catch {
    return next(ApiError.unauthorized('Access token is invalid or expired'));
  }
}

// Role permissions change rarely — cache them briefly to avoid a query per request.
const permCache = new Map<number, { codes: Set<string>; expires: number }>();
const PERM_CACHE_TTL_MS = 60_000;

export async function getRolePermissions(roleId: number): Promise<Set<string>> {
  const cached = permCache.get(roleId);
  if (cached && cached.expires > Date.now()) return cached.codes;

  const rows = await query<{ code: string }>(
    `SELECT p.code FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = $1`,
    [roleId],
  );
  const codes = new Set(rows.map((r) => r.code));
  permCache.set(roleId, { codes, expires: Date.now() + PERM_CACHE_TTL_MS });
  return codes;
}

export function invalidatePermissionCache() {
  permCache.clear();
}

/** RBAC guard: allows the request if the user's role has ANY of the given permissions. */
export function authorize(...required: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const codes = await getRolePermissions(req.user.roleId);
      if (!required.some((code) => codes.has(code))) {
        throw ApiError.forbidden();
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

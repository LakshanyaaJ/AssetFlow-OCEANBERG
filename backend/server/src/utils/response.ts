import { Response } from 'express';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Standard success envelope: { success, data, meta? } — identical shape on every endpoint. */
export function ok(res: Response, data: unknown, meta?: PageMeta, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created(res: Response, data: unknown) {
  return ok(res, data, undefined, 201);
}

export function noContent(res: Response) {
  return res.status(204).send();
}

import { Router } from 'express';
import { AnyZodObject, z } from 'zod';
import { query, queryOne } from '../config/db';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { buildListClause, ListParams, pageMeta, parseListParams } from '../utils/pagination';
import { created, noContent, ok } from '../utils/response';
import { logActivity } from './activity';

/**
 * Generic Repository/Service/Controller for master-data entities
 * (departments, locations, categories, resources, ...).
 * Eliminates duplicated CRUD plumbing while preserving the layered architecture:
 * each entity supplies only its schema, whitelists and permissions.
 */
export interface CrudConfig {
  entity: string; // 'Department' — used in error messages
  entityType: string; // 'department' — used in activity logs
  table: string;
  /** SELECT ... FROM <table> t [JOIN ...] — main table MUST be aliased `t`. */
  baseSelect: string;
  insertable: string[];
  updatable: string[];
  searchable: string[]; // aliased columns, e.g. 't.name'
  sortable: string[];
  defaultSort: string;
  filterable?: Record<string, string>; // queryParam -> aliased column
  softDelete?: boolean; // toggles t.is_active instead of DELETE
}

export function makeCrudRepository(cfg: CrudConfig) {
  return {
    async list(params: ListParams) {
      const { where, orderLimit, values } = buildListClause(params, cfg.searchable);
      const rows = await query(`${cfg.baseSelect} ${where} ${orderLimit}`, values);
      const countValues = values.slice(0, -2); // strip LIMIT/OFFSET params
      const totalRow = await queryOne<{ total: number }>(
        `SELECT count(*)::int AS total FROM (${cfg.baseSelect} ${where}) sub`,
        countValues,
      );
      return { rows, total: totalRow?.total ?? 0 };
    },

    findById(id: number) {
      return queryOne(`${cfg.baseSelect} WHERE t.id = $1`, [id]);
    },

    async create(data: Record<string, unknown>) {
      const cols = cfg.insertable.filter((c) => data[c] !== undefined);
      const placeholders = cols.map((_, i) => `$${i + 1}`);
      const row = await queryOne<{ id: number }>(
        `INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`,
        cols.map((c) => data[c]),
      );
      return row!.id;
    },

    async update(id: number, data: Record<string, unknown>) {
      const cols = cfg.updatable.filter((c) => data[c] !== undefined);
      if (cols.length === 0) return;
      const sets = cols.map((c, i) => `${c} = $${i + 2}`);
      await query(`UPDATE ${cfg.table} SET ${sets.join(', ')} WHERE id = $1`, [
        id,
        ...cols.map((c) => data[c]),
      ]);
    },

    async remove(id: number) {
      if (cfg.softDelete) {
        await query(`UPDATE ${cfg.table} SET is_active = false WHERE id = $1`, [id]);
      } else {
        await query(`DELETE FROM ${cfg.table} WHERE id = $1`, [id]);
      }
    },
  };
}

export function makeCrudService(cfg: CrudConfig) {
  const repo = makeCrudRepository(cfg);
  return {
    repo,
    async list(rawQuery: Record<string, unknown>) {
      const params = parseListParams(rawQuery, {
        sortable: cfg.sortable,
        defaultSort: cfg.defaultSort,
        filterable: cfg.filterable,
      });
      const { rows, total } = await repo.list(params);
      return { rows, meta: pageMeta(params, total) };
    },

    async get(id: number) {
      const row = await repo.findById(id);
      if (!row) throw ApiError.notFound(cfg.entity);
      return row;
    },

    async create(data: Record<string, unknown>, actorId: number, ip?: string) {
      const id = await repo.create(data);
      await logActivity({
        userId: actorId,
        action: `${cfg.entityType}.create`,
        entityType: cfg.entityType,
        entityId: id,
        details: { data },
        ip,
      });
      return this.get(id);
    },

    async update(id: number, data: Record<string, unknown>, actorId: number, ip?: string) {
      await this.get(id); // 404 if missing
      await repo.update(id, data);
      await logActivity({
        userId: actorId,
        action: `${cfg.entityType}.update`,
        entityType: cfg.entityType,
        entityId: id,
        details: { data },
        ip,
      });
      return this.get(id);
    },

    async remove(id: number, actorId: number, ip?: string) {
      await this.get(id);
      await repo.remove(id);
      await logActivity({
        userId: actorId,
        action: cfg.softDelete ? `${cfg.entityType}.deactivate` : `${cfg.entityType}.delete`,
        entityType: cfg.entityType,
        entityId: id,
        ip,
      });
    },
  };
}

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export interface CrudRouterOptions {
  cfg: CrudConfig;
  createSchema: AnyZodObject;
  updateSchema: AnyZodObject;
  readPermissions: string[];
  managePermissions: string[];
}

/** Standard REST router: GET /, GET /:id, POST /, PATCH /:id, DELETE /:id */
export function makeCrudRouter(opts: CrudRouterOptions): { router: Router; service: ReturnType<typeof makeCrudService> } {
  const service = makeCrudService(opts.cfg);
  const router = Router();
  router.use(authenticate);

  router.get(
    '/',
    authorize(...opts.readPermissions),
    asyncHandler(async (req, res) => {
      const { rows, meta } = await service.list(req.query as Record<string, unknown>);
      ok(res, rows, meta);
    }),
  );

  router.get(
    '/:id',
    authorize(...opts.readPermissions),
    validate({ params: idParamSchema }),
    asyncHandler(async (req, res) => {
      ok(res, await service.get(Number(req.params.id)));
    }),
  );

  router.post(
    '/',
    authorize(...opts.managePermissions),
    validate({ body: opts.createSchema }),
    asyncHandler(async (req, res) => {
      created(res, await service.create(req.body, req.user!.id, req.ip));
    }),
  );

  router.patch(
    '/:id',
    authorize(...opts.managePermissions),
    validate({ params: idParamSchema, body: opts.updateSchema }),
    asyncHandler(async (req, res) => {
      ok(res, await service.update(Number(req.params.id), req.body, req.user!.id, req.ip));
    }),
  );

  router.delete(
    '/:id',
    authorize(...opts.managePermissions),
    validate({ params: idParamSchema }),
    asyncHandler(async (req, res) => {
      await service.remove(Number(req.params.id), req.user!.id, req.ip);
      noContent(res);
    }),
  );

  return { router, service };
}

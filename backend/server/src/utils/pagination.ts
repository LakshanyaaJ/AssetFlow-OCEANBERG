import { z } from 'zod';
import { PageMeta } from './response';

export interface ListParams {
  page: number;
  limit: number;
  sortBy: string;
  order: 'asc' | 'desc';
  search?: string;
  filters: Record<string, string>;
}

export interface ListOptions {
  /** Whitelisted sort columns — anything else is rejected (prevents ORDER BY injection). */
  sortable: string[];
  defaultSort: string;
  /** Whitelisted equality-filter query params, mapped to SQL columns. */
  filterable?: Record<string, string>;
}

const baseQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().max(200).optional(),
});

/** Parse + sanitize list query params against a per-endpoint whitelist. */
export function parseListParams(raw: Record<string, unknown>, opts: ListOptions): ListParams {
  const q = baseQuery.parse(raw);
  const sortBy = q.sortBy && opts.sortable.includes(q.sortBy) ? q.sortBy : opts.defaultSort;
  const filters: Record<string, string> = {};
  for (const [param, column] of Object.entries(opts.filterable ?? {})) {
    const value = raw[param];
    if (typeof value === 'string' && value.length > 0) filters[column] = value;
  }
  return { page: q.page, limit: q.limit, sortBy, order: q.order, search: q.search, filters };
}

/**
 * Compose the WHERE/ORDER/LIMIT tail of a list query with positional params.
 * Column names come exclusively from server-side whitelists; values are parameterized.
 */
export function buildListClause(
  params: ListParams,
  searchColumns: string[],
  startIndex = 1,
  extraWhere: string[] = [],
  extraValues: unknown[] = [],
): { where: string; orderLimit: string; values: unknown[] } {
  const conditions: string[] = [...extraWhere];
  const values: unknown[] = [...extraValues];
  let i = startIndex + extraValues.length;

  for (const [column, value] of Object.entries(params.filters)) {
    conditions.push(`${column} = $${i++}`);
    values.push(value);
  }
  if (params.search && searchColumns.length > 0) {
    const clauses = searchColumns.map((col) => `${col} ILIKE $${i}`);
    values.push(`%${params.search}%`);
    i++;
    conditions.push(`(${clauses.join(' OR ')})`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.limit;
  const orderLimit = `ORDER BY ${params.sortBy} ${params.order.toUpperCase()} LIMIT $${i} OFFSET $${i + 1}`;
  values.push(params.limit, offset);
  return { where, orderLimit, values };
}

export function pageMeta(params: ListParams, total: number): PageMeta {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

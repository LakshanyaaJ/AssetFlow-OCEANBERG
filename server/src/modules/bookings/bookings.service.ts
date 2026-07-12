import { logActivity } from '../../shared/activity';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, parseListParams } from '../../utils/pagination';
import { bookingsRepository } from './bookings.repository';

const LIST_OPTIONS = {
  sortable: ['t.starts_at', 't.ends_at', 't.created_at', 't.status'],
  defaultSort: 't.starts_at',
  filterable: { resourceId: 't.resource_id', status: 't.status' },
};

const MAX_BOOKING_HOURS = 24 * 14; // two weeks

export const bookingsService = {
  async list(rawQuery: Record<string, unknown>, mineUserId?: number) {
    const params = parseListParams(rawQuery, LIST_OPTIONS);
    const extraWhere = mineUserId ? ['t.booked_by = $1'] : [];
    const extraValues = mineUserId ? [mineUserId] : [];
    const { rows, total } = await bookingsRepository.list(params, extraWhere, extraValues);
    return { rows, meta: pageMeta(params, total) };
  },

  async get(id: number) {
    const row = await bookingsRepository.findById(id);
    if (!row) throw ApiError.notFound('Booking');
    return row;
  },

  /**
   * Book a resource. Overlap detection is two-layered:
   *  1. friendly pre-check with the exact conflicting slot in the error,
   *  2. the DB EXCLUDE constraint rejects races the pre-check can't see.
   */
  async create(
    data: { resourceId: number; purpose: string; startsAt: string; endsAt: string },
    actorId: number,
    ip?: string,
  ) {
    const resource = await bookingsRepository.findResource(data.resourceId);
    if (!resource) throw ApiError.notFound('Resource');
    if (!resource.is_active) throw ApiError.conflict('This resource is not bookable');

    const start = new Date(data.startsAt);
    const end = new Date(data.endsAt);
    if (start <= new Date()) throw ApiError.badRequest('Booking must start in the future');
    if (end <= start) throw ApiError.badRequest('End time must be after start time');
    if ((end.getTime() - start.getTime()) / 3_600_000 > MAX_BOOKING_HOURS) {
      throw ApiError.badRequest(`A booking cannot exceed ${MAX_BOOKING_HOURS / 24} days`);
    }

    const clash = await bookingsRepository.findOverlap(data.resourceId, data.startsAt, data.endsAt);
    if (clash) {
      throw ApiError.conflict(
        `"${resource.name}" is already booked from ${new Date(clash.starts_at).toLocaleString()} to ${new Date(clash.ends_at).toLocaleString()}`,
      );
    }

    const id = await bookingsRepository.insert({
      resourceId: data.resourceId, bookedBy: actorId,
      purpose: data.purpose, startsAt: data.startsAt, endsAt: data.endsAt,
    });
    await logActivity({
      userId: actorId, action: 'booking.create', entityType: 'booking', entityId: id,
      details: { resourceId: data.resourceId, startsAt: data.startsAt, endsAt: data.endsAt }, ip,
    });
    return this.get(id);
  },

  /** Owner can cancel their own booking; 'booking.manage' holders can cancel any. */
  async cancel(id: number, actorId: number, canManage: boolean, ip?: string) {
    const booking = await this.get(id);
    if (booking.booked_by !== actorId && !canManage) {
      throw ApiError.forbidden('You can only cancel your own bookings');
    }
    if (booking.status !== 'confirmed') {
      throw ApiError.conflict(`Only confirmed bookings can be cancelled (currently '${booking.status}')`);
    }
    if (new Date(booking.ends_at) < new Date()) {
      throw ApiError.conflict('This booking has already ended');
    }
    await bookingsRepository.setStatus(id, 'cancelled');
    await logActivity({ userId: actorId, action: 'booking.cancel', entityType: 'booking', entityId: id, ip });
    return this.get(id);
  },

  calendar(resourceId: number, from: string, to: string) {
    return bookingsRepository.calendar(resourceId, from, to);
  },
};

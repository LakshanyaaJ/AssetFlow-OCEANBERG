import cron from 'node-cron';
import { query } from '../config/db';

/**
 * Automatic overdue detection — runs every 15 minutes.
 *  1. Overdue allocations: notify the holder and the allocator (once per allocation).
 *  2. Finished bookings: confirmed → completed.
 *  3. Expired refresh tokens: purged.
 * Each statement is idempotent, so restarts and overlapping runs are harmless.
 */
async function detectOverdueAllocations(): Promise<number> {
  // NOT EXISTS guard prevents duplicate reminders for the same allocation.
  const rows = await query<{ id: number }>(`
    WITH overdue AS (
      SELECT aa.id, aa.asset_id, aa.due_at, aa.allocated_by, e.user_id AS holder_user_id,
             a.name AS asset_name, a.asset_tag
      FROM asset_allocations aa
      JOIN employees e ON e.id = aa.employee_id
      JOIN assets a ON a.id = aa.asset_id
      WHERE aa.returned_at IS NULL AND aa.due_at IS NOT NULL AND aa.due_at < now()
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.entity_type = 'allocation' AND n.entity_id = aa.id AND n.n_type = 'overdue'
        )
    ),
    holder_note AS (
      INSERT INTO notifications (user_id, title, message, n_type, entity_type, entity_id)
      SELECT holder_user_id, 'Asset return overdue',
             'Asset ' || asset_tag || ' (' || asset_name || ') was due back on ' || to_char(due_at, 'DD Mon YYYY') || '.',
             'overdue', 'allocation', id
      FROM overdue WHERE holder_user_id IS NOT NULL
      RETURNING 1
    )
    INSERT INTO notifications (user_id, title, message, n_type, entity_type, entity_id)
    SELECT allocated_by, 'Allocation overdue',
           'Asset ' || asset_tag || ' has not been returned (due ' || to_char(due_at, 'DD Mon YYYY') || ').',
           'overdue', 'allocation', id
    FROM overdue
    RETURNING id`);
  return rows.length;
}

async function completeFinishedBookings(): Promise<number> {
  const rows = await query<{ id: number }>(
    `UPDATE bookings SET status = 'completed'
     WHERE status = 'confirmed' AND ends_at < now() RETURNING id`,
  );
  return rows.length;
}

async function purgeExpiredRefreshTokens(): Promise<void> {
  await query(`DELETE FROM refresh_tokens WHERE expires_at < now() - interval '1 day'`);
}

export async function runOverdueSweep(): Promise<void> {
  try {
    const overdue = await detectOverdueAllocations();
    const completed = await completeFinishedBookings();
    await purgeExpiredRefreshTokens();
    if (overdue > 0 || completed > 0) {
      console.log(`[jobs] overdue sweep: ${overdue} overdue notice(s), ${completed} booking(s) completed`);
    }
  } catch (err) {
    console.error('[jobs] overdue sweep failed', err);
  }
}

export function startJobs(): void {
  cron.schedule('*/15 * * * *', runOverdueSweep);
  void runOverdueSweep(); // also run once at boot
  console.log('[jobs] overdue detection scheduled (every 15 minutes)');
}

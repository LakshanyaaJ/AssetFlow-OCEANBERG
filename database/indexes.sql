-- ============================================================
-- AssetFlow ERP — Performance Indexes
-- Every FK used in JOINs, every hot filter column, and every
-- search column gets an index. Partial indexes cover the
-- "active row" access patterns that dominate an ERP workload.
-- ============================================================

BEGIN;

-- users / auth
CREATE INDEX idx_users_role            ON users(role_id);
CREATE INDEX idx_refresh_tokens_user   ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expiry ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

-- organization
CREATE INDEX idx_employees_department  ON employees(department_id);
CREATE INDEX idx_employees_location    ON employees(location_id);
CREATE INDEX idx_locations_parent      ON locations(parent_id);

-- assets (list screens filter by status/category/location; search by name/tag)
CREATE INDEX idx_assets_category       ON assets(category_id);
CREATE INDEX idx_assets_location       ON assets(location_id);
CREATE INDEX idx_assets_status         ON assets(status);
CREATE INDEX idx_assets_name_search    ON assets USING gin (to_tsvector('simple', name || ' ' || asset_tag));
CREATE INDEX idx_asset_images_asset    ON asset_images(asset_id);
CREATE INDEX idx_asset_documents_asset ON asset_documents(asset_id);
CREATE INDEX idx_status_history_asset  ON asset_status_history(asset_id, changed_at DESC);

-- allocations (active allocations + per-employee history are the hot paths)
CREATE INDEX idx_allocations_asset     ON asset_allocations(asset_id);
CREATE INDEX idx_allocations_employee  ON asset_allocations(employee_id);
CREATE INDEX idx_allocations_overdue   ON asset_allocations(due_at)
  WHERE returned_at IS NULL AND due_at IS NOT NULL;

-- transfers
CREATE INDEX idx_transfers_asset       ON transfer_requests(asset_id);
CREATE INDEX idx_transfers_status      ON transfer_requests(status);
CREATE INDEX idx_transfers_requester   ON transfer_requests(requested_by);

-- resources & bookings (calendar queries scan by resource + time range)
CREATE INDEX idx_resources_location    ON resources(location_id);
CREATE INDEX idx_bookings_resource_time ON bookings(resource_id, starts_at);
CREATE INDEX idx_bookings_user         ON bookings(booked_by);
CREATE INDEX idx_bookings_open         ON bookings(ends_at) WHERE status = 'confirmed';

-- maintenance
CREATE INDEX idx_maintenance_asset     ON maintenance_requests(asset_id);
CREATE INDEX idx_maintenance_status    ON maintenance_requests(status);
CREATE INDEX idx_maintenance_reporter  ON maintenance_requests(reported_by);
CREATE INDEX idx_maint_assign_request  ON maintenance_assignments(maintenance_request_id);
CREATE INDEX idx_maint_assign_employee ON maintenance_assignments(assigned_to);

-- audit
CREATE INDEX idx_audit_items_cycle     ON audit_items(audit_cycle_id);
CREATE INDEX idx_audit_items_status    ON audit_items(audit_cycle_id, status);
CREATE INDEX idx_audit_cycles_status   ON audit_cycles(status);

-- notifications (unread badge query runs on every page load)
CREATE INDEX idx_notifications_unread  ON notifications(user_id, created_at DESC) WHERE NOT is_read;
CREATE INDEX idx_notifications_user    ON notifications(user_id, created_at DESC);

-- activity logs (timeline per entity + per user)
CREATE INDEX idx_activity_entity       ON activity_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_activity_user         ON activity_logs(user_id, created_at DESC);

COMMIT;

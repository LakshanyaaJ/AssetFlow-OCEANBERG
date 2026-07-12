-- ============================================================
-- AssetFlow ERP — PostgreSQL Schema
-- Normalized (3NF), constraint-driven, transaction-safe.
-- Run order: schema.sql -> indexes.sql -> seed.sql
-- ============================================================

BEGIN;

-- btree_gist enables the booking-overlap EXCLUDE constraint (DB-level guarantee)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ------------------------------------------------------------
-- updated_at maintenance trigger (single reusable function)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- IDENTITY & ACCESS
-- ============================================================

CREATE TABLE roles (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,
  description VARCHAR(255),
  is_system   BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        VARCHAR(80)  NOT NULL UNIQUE,          -- e.g. 'asset.create'
  description VARCHAR(255)
);

CREATE TABLE role_permissions (
  role_id       INT NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  role_id       INT          NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,             -- SHA-256, never plaintext
  expires_at TIMESTAMPTZ  NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- ORGANIZATION
-- ============================================================

CREATE TABLE departments (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  code        VARCHAR(20)  NOT NULL UNIQUE,
  description VARCHAR(255),
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_departments_updated BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE locations (
  id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  address    VARCHAR(255),
  city       VARCHAR(80),
  parent_id  INT REFERENCES locations(id) ON DELETE SET NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE TRIGGER trg_locations_updated BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE employees (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       INT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  employee_code VARCHAR(20)  NOT NULL UNIQUE,
  full_name     VARCHAR(120) NOT NULL,
  designation   VARCHAR(100),
  phone         VARCHAR(20),
  department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  location_id   INT NOT NULL REFERENCES locations(id)   ON DELETE RESTRICT,
  joined_on     DATE,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ASSETS
-- ============================================================

CREATE TABLE asset_categories (
  id                INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name              VARCHAR(100) NOT NULL UNIQUE,
  code              VARCHAR(20)  NOT NULL UNIQUE,
  parent_id         INT REFERENCES asset_categories(id) ON DELETE SET NULL,
  depreciation_rate NUMERIC(5,2) CHECK (depreciation_rate BETWEEN 0 AND 100),
  description       VARCHAR(255),
  is_active         BOOLEAN      NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE TRIGGER trg_asset_categories_updated BEFORE UPDATE ON asset_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Asset lifecycle state machine is enforced in the service layer;
-- the CHECK constraint guarantees only valid states ever persist.
CREATE TABLE assets (
  id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_tag       VARCHAR(30)  NOT NULL UNIQUE,       -- e.g. AST-2026-00042
  name            VARCHAR(150) NOT NULL,
  category_id     INT NOT NULL REFERENCES asset_categories(id) ON DELETE RESTRICT,
  location_id     INT NOT NULL REFERENCES locations(id)        ON DELETE RESTRICT,
  status          VARCHAR(20)  NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available','allocated','in_transfer',
                                    'under_maintenance','retired','lost')),
  serial_number   VARCHAR(100) UNIQUE,
  model           VARCHAR(100),
  vendor          VARCHAR(120),
  purchase_date   DATE,
  purchase_cost   NUMERIC(12,2) CHECK (purchase_cost >= 0),
  warranty_expiry DATE,
  description     TEXT,
  created_by      INT REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (warranty_expiry IS NULL OR purchase_date IS NULL OR warranty_expiry >= purchase_date)
);
CREATE TRIGGER trg_assets_updated BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE asset_images (
  id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_id   INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  file_url   VARCHAR(500) NOT NULL,
  is_primary BOOLEAN      NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- at most one primary image per asset
CREATE UNIQUE INDEX uq_asset_primary_image ON asset_images(asset_id) WHERE is_primary;

CREATE TABLE asset_documents (
  id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_id   INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  title      VARCHAR(150) NOT NULL,
  doc_type   VARCHAR(30)  NOT NULL DEFAULT 'other'
             CHECK (doc_type IN ('invoice','warranty','manual','insurance','other')),
  file_url   VARCHAR(500) NOT NULL,
  uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- immutable audit trail of every lifecycle transition
CREATE TABLE asset_status_history (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_id    INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status   VARCHAR(20) NOT NULL,
  reason      VARCHAR(255),
  changed_by  INT REFERENCES users(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ALLOCATION & TRANSFER
-- ============================================================

CREATE TABLE asset_allocations (
  id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_id         INT NOT NULL REFERENCES assets(id)    ON DELETE RESTRICT,
  employee_id      INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  allocated_by     INT NOT NULL REFERENCES users(id)     ON DELETE RESTRICT,
  allocated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at           TIMESTAMPTZ,
  returned_at      TIMESTAMPTZ,
  return_condition VARCHAR(20) CHECK (return_condition IN ('good','damaged','needs_repair')),
  notes            VARCHAR(500),
  CHECK (returned_at IS NULL OR returned_at >= allocated_at),
  CHECK (due_at     IS NULL OR due_at     >  allocated_at)
);
-- HARD business rule: an asset can have only ONE active allocation
CREATE UNIQUE INDEX uq_active_allocation ON asset_allocations(asset_id)
  WHERE returned_at IS NULL;

CREATE TABLE transfer_requests (
  id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_id         INT NOT NULL REFERENCES assets(id)    ON DELETE RESTRICT,
  from_location_id INT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  to_location_id   INT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','completed','cancelled')),
  reason           VARCHAR(500),
  requested_by     INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decided_by       INT REFERENCES users(id) ON DELETE SET NULL,
  decision_note    VARCHAR(500),
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  CHECK (from_location_id <> to_location_id)
);
-- only one open transfer per asset
CREATE UNIQUE INDEX uq_open_transfer ON transfer_requests(asset_id)
  WHERE status IN ('pending','approved');

-- ============================================================
-- RESOURCES & BOOKINGS
-- ============================================================

CREATE TABLE resources (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  code          VARCHAR(20)  NOT NULL UNIQUE,
  resource_type VARCHAR(20)  NOT NULL
                CHECK (resource_type IN ('meeting_room','vehicle','equipment','workspace')),
  location_id   INT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  capacity      INT CHECK (capacity > 0),
  description   VARCHAR(255),
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_resources_updated BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE bookings (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  resource_id INT NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
  booked_by   INT NOT NULL REFERENCES users(id)     ON DELETE RESTRICT,
  purpose     VARCHAR(255) NOT NULL,
  starts_at   TIMESTAMPTZ  NOT NULL,
  ends_at     TIMESTAMPTZ  NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'confirmed'
              CHECK (status IN ('confirmed','cancelled','completed')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  -- HARD business rule: no overlapping confirmed bookings for a resource.
  -- Enforced at DB level, race-condition proof.
  EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status = 'confirmed')
);
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- MAINTENANCE
-- ============================================================

CREATE TABLE maintenance_requests (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_id      INT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  title         VARCHAR(150) NOT NULL,
  description   TEXT,
  priority      VARCHAR(10) NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low','medium','high','critical')),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','in_progress',
                                  'completed','cancelled')),
  maintenance_type VARCHAR(20) NOT NULL DEFAULT 'corrective'
                CHECK (maintenance_type IN ('corrective','preventive')),
  cost          NUMERIC(12,2) CHECK (cost >= 0),
  resolution    VARCHAR(500),
  reported_by   INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decided_by    INT REFERENCES users(id) ON DELETE SET NULL,
  scheduled_for DATE,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_maintenance_updated BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE maintenance_assignments (
  id                     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  maintenance_request_id INT NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  assigned_to            INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  assigned_by            INT NOT NULL REFERENCES users(id)     ON DELETE RESTRICT,
  notes                  VARCHAR(500),
  assigned_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (maintenance_request_id, assigned_to)
);

-- ============================================================
-- AUDIT
-- ============================================================

CREATE TABLE audit_cycles (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  location_id INT REFERENCES locations(id) ON DELETE RESTRICT,  -- NULL = org-wide
  status      VARCHAR(20)  NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','in_progress','completed','cancelled')),
  starts_on   DATE NOT NULL,
  ends_on     DATE NOT NULL,
  created_by  INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_on >= starts_on)
);
CREATE TRIGGER trg_audit_cycles_updated BEFORE UPDATE ON audit_cycles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE audit_items (
  id                   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  audit_cycle_id       INT NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
  asset_id             INT NOT NULL REFERENCES assets(id)       ON DELETE CASCADE,
  expected_location_id INT NOT NULL REFERENCES locations(id)    ON DELETE RESTRICT,
  status               VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','found','missing','damaged','misplaced')),
  remarks              VARCHAR(500),
  checked_by           INT REFERENCES users(id) ON DELETE SET NULL,
  checked_at           TIMESTAMPTZ,
  UNIQUE (audit_cycle_id, asset_id)
);

-- ============================================================
-- NOTIFICATIONS & ACTIVITY LOGS
-- ============================================================

CREATE TABLE notifications (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(150) NOT NULL,
  message     VARCHAR(500) NOT NULL,
  n_type      VARCHAR(30)  NOT NULL DEFAULT 'info'
              CHECK (n_type IN ('info','success','warning','error','approval','overdue')),
  entity_type VARCHAR(40),
  entity_id   INT,
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(60)  NOT NULL,               -- e.g. 'asset.allocate'
  entity_type VARCHAR(40)  NOT NULL,
  entity_id   INT,
  details     JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMIT;

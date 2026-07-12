-- ============================================================
-- AssetFlow ERP — Seed Data
-- All demo users share the password: Password@123
-- (hash generated with bcrypt, cost 10)
-- ============================================================

BEGIN;

-- ---------- roles ----------
INSERT INTO roles (name, description, is_system) VALUES
  ('admin',      'Full system access',                          true),
  ('manager',    'Approves transfers/maintenance, manages assets', true),
  ('employee',   'Requests assets, books resources',            true),
  ('technician', 'Executes maintenance work orders',            true),
  ('auditor',    'Runs physical audit cycles',                  true);

-- ---------- permissions ----------
INSERT INTO permissions (code, description) VALUES
  ('user.manage',        'Create/update users and roles'),
  ('org.manage',         'Manage departments, locations, employees'),
  ('org.read',           'View departments, locations, employees'),
  ('asset.read',         'View asset directory'),
  ('asset.manage',       'Create/update/retire assets'),
  ('allocation.read',    'View allocations'),
  ('allocation.manage',  'Allocate and return assets'),
  ('transfer.read',      'View transfer requests'),
  ('transfer.request',   'Raise transfer requests'),
  ('transfer.approve',   'Approve/reject/complete transfers'),
  ('resource.manage',    'Manage bookable resources'),
  ('booking.read',       'View bookings'),
  ('booking.create',     'Book resources'),
  ('booking.manage',     'Cancel any booking'),
  ('maintenance.read',   'View maintenance requests'),
  ('maintenance.request','Raise maintenance requests'),
  ('maintenance.approve','Approve/reject/assign maintenance'),
  ('maintenance.execute','Start/complete assigned maintenance'),
  ('audit.read',         'View audit cycles'),
  ('audit.manage',       'Create/complete audit cycles'),
  ('audit.execute',      'Check audit items'),
  ('report.read',        'View reports'),
  ('activity.read',      'View activity logs');

-- ---------- role -> permission matrix ----------
-- admin: everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'admin';

-- manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN (
  'org.manage','org.read','asset.read','asset.manage',
  'allocation.read','allocation.manage',
  'transfer.read','transfer.request','transfer.approve',
  'resource.manage','booking.read','booking.create','booking.manage',
  'maintenance.read','maintenance.request','maintenance.approve',
  'audit.read','audit.manage','report.read','activity.read'
) WHERE r.name = 'manager';

-- employee
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN (
  'org.read','asset.read','allocation.read',
  'transfer.read','transfer.request',
  'booking.read','booking.create',
  'maintenance.read','maintenance.request'
) WHERE r.name = 'employee';

-- technician = employee + execute maintenance
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN (
  'org.read','asset.read','allocation.read','booking.read','booking.create',
  'maintenance.read','maintenance.request','maintenance.execute'
) WHERE r.name = 'technician';

-- auditor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN (
  'org.read','asset.read','allocation.read',
  'audit.read','audit.execute','report.read'
) WHERE r.name = 'auditor';

-- ---------- users (password: Password@123) ----------
INSERT INTO users (email, password_hash, full_name, role_id) VALUES
  ('admin@assetflow.io',    '__BCRYPT_HASH__', 'Ava Administrator', (SELECT id FROM roles WHERE name='admin')),
  ('manager@assetflow.io',  '__BCRYPT_HASH__', 'Miles Manager',     (SELECT id FROM roles WHERE name='manager')),
  ('employee@assetflow.io', '__BCRYPT_HASH__', 'Elena Employee',    (SELECT id FROM roles WHERE name='employee')),
  ('tech@assetflow.io',     '__BCRYPT_HASH__', 'Theo Technician',   (SELECT id FROM roles WHERE name='technician')),
  ('auditor@assetflow.io',  '__BCRYPT_HASH__', 'Aria Auditor',      (SELECT id FROM roles WHERE name='auditor'));

-- ---------- organization ----------
INSERT INTO departments (name, code, description) VALUES
  ('Engineering', 'ENG',  'Product engineering'),
  ('Operations',  'OPS',  'Facilities and operations'),
  ('Finance',     'FIN',  'Finance and accounting'),
  ('Human Resources', 'HR', 'People operations');

INSERT INTO locations (name, code, address, city) VALUES
  ('Headquarters',     'HQ',   '12 Marine Drive',   'Mumbai'),
  ('Bengaluru Office', 'BLR',  '44 MG Road',        'Bengaluru'),
  ('Pune Warehouse',   'PUNE', 'Plot 7, MIDC',      'Pune');

INSERT INTO employees (user_id, employee_code, full_name, designation, phone, department_id, location_id, joined_on) VALUES
  ((SELECT id FROM users WHERE email='manager@assetflow.io'),  'EMP-001', 'Miles Manager',   'Operations Manager', '+91-9800000001', (SELECT id FROM departments WHERE code='OPS'), (SELECT id FROM locations WHERE code='HQ'),  '2022-04-01'),
  ((SELECT id FROM users WHERE email='employee@assetflow.io'), 'EMP-002', 'Elena Employee',  'Software Engineer',  '+91-9800000002', (SELECT id FROM departments WHERE code='ENG'), (SELECT id FROM locations WHERE code='BLR'), '2023-07-15'),
  ((SELECT id FROM users WHERE email='tech@assetflow.io'),     'EMP-003', 'Theo Technician', 'Service Technician', '+91-9800000003', (SELECT id FROM departments WHERE code='OPS'), (SELECT id FROM locations WHERE code='HQ'),  '2021-11-20'),
  ((SELECT id FROM users WHERE email='auditor@assetflow.io'),  'EMP-004', 'Aria Auditor',    'Internal Auditor',   '+91-9800000004', (SELECT id FROM departments WHERE code='FIN'), (SELECT id FROM locations WHERE code='HQ'),  '2022-09-05'),
  (NULL, 'EMP-005', 'Ravi Kumar',  'QA Engineer',     '+91-9800000005', (SELECT id FROM departments WHERE code='ENG'), (SELECT id FROM locations WHERE code='BLR'), '2024-01-10'),
  (NULL, 'EMP-006', 'Sana Sheikh', 'HR Generalist',   '+91-9800000006', (SELECT id FROM departments WHERE code='HR'),  (SELECT id FROM locations WHERE code='HQ'),  '2023-03-22');

-- ---------- asset categories ----------
INSERT INTO asset_categories (name, code, depreciation_rate, description) VALUES
  ('IT Equipment',     'IT',   33.33, 'Computing hardware'),
  ('Office Furniture', 'FURN', 10.00, 'Desks, chairs, cabinets'),
  ('Vehicles',         'VEH',  15.00, 'Company vehicles'),
  ('Machinery',        'MACH', 20.00, 'Warehouse machinery');

INSERT INTO asset_categories (name, code, parent_id, depreciation_rate, description) VALUES
  ('Laptops',  'IT-LAP', (SELECT id FROM asset_categories WHERE code='IT'), 33.33, 'Portable computers'),
  ('Monitors', 'IT-MON', (SELECT id FROM asset_categories WHERE code='IT'), 25.00, 'Displays'),
  ('Printers', 'IT-PRN', (SELECT id FROM asset_categories WHERE code='IT'), 25.00, 'Print devices');

-- ---------- assets ----------
INSERT INTO assets (asset_tag, name, category_id, location_id, status, serial_number, model, vendor, purchase_date, purchase_cost, warranty_expiry, created_by) VALUES
  ('AST-2024-0001', 'MacBook Pro 14" M3',    (SELECT id FROM asset_categories WHERE code='IT-LAP'), (SELECT id FROM locations WHERE code='BLR'),  'available', 'SN-MBP-9001', 'A2918',        'Apple',   '2024-02-10', 189000, '2027-02-10', (SELECT id FROM users WHERE email='admin@assetflow.io')),
  ('AST-2024-0002', 'Dell Latitude 5440',    (SELECT id FROM asset_categories WHERE code='IT-LAP'), (SELECT id FROM locations WHERE code='BLR'),  'available', 'SN-DL-5501',  'Latitude 5440','Dell',    '2024-03-05',  92000, '2027-03-05', (SELECT id FROM users WHERE email='admin@assetflow.io')),
  ('AST-2024-0003', 'ThinkPad X1 Carbon',    (SELECT id FROM asset_categories WHERE code='IT-LAP'), (SELECT id FROM locations WHERE code='HQ'),   'available', 'SN-TP-7723',  'X1 Gen 11',    'Lenovo',  '2024-01-18', 145000, '2027-01-18', (SELECT id FROM users WHERE email='admin@assetflow.io')),
  ('AST-2024-0004', 'Dell U2723QE Monitor',  (SELECT id FROM asset_categories WHERE code='IT-MON'), (SELECT id FROM locations WHERE code='HQ'),   'available', 'SN-MON-1201', 'U2723QE',      'Dell',    '2024-04-02',  52000, '2027-04-02', (SELECT id FROM users WHERE email='admin@assetflow.io')),
  ('AST-2024-0005', 'HP LaserJet Pro M428',  (SELECT id FROM asset_categories WHERE code='IT-PRN'), (SELECT id FROM locations WHERE code='HQ'),   'available', 'SN-PRN-3310', 'M428fdw',      'HP',      '2023-09-12',  38000, '2025-09-12', (SELECT id FROM users WHERE email='admin@assetflow.io')),
  ('AST-2023-0006', 'Ergonomic Desk Chair',  (SELECT id FROM asset_categories WHERE code='FURN'),   (SELECT id FROM locations WHERE code='HQ'),   'available', NULL,          'Aeron',        'Herman Miller','2023-06-20', 65000, NULL,      (SELECT id FROM users WHERE email='admin@assetflow.io')),
  ('AST-2023-0007', 'Standing Desk 160cm',   (SELECT id FROM asset_categories WHERE code='FURN'),   (SELECT id FROM locations WHERE code='BLR'),  'available', NULL,          'Jarvis',       'Fully',   '2023-06-20',  42000, NULL,        (SELECT id FROM users WHERE email='admin@assetflow.io')),
  ('AST-2022-0008', 'Toyota Innova Crysta',  (SELECT id FROM asset_categories WHERE code='VEH'),    (SELECT id FROM locations WHERE code='HQ'),   'available', 'MH01-AB-4321','Crysta 2.4',   'Toyota',  '2022-08-01', 2100000,'2025-08-01', (SELECT id FROM users WHERE email='admin@assetflow.io')),
  ('AST-2022-0009', 'Forklift 2T',           (SELECT id FROM asset_categories WHERE code='MACH'),   (SELECT id FROM locations WHERE code='PUNE'), 'available', 'FL-2T-0092',  'GX-200',       'Godrej',  '2022-05-14', 1250000,'2026-05-14', (SELECT id FROM users WHERE email='admin@assetflow.io')),
  ('AST-2021-0010', 'Old Projector Epson',   (SELECT id FROM asset_categories WHERE code='IT'),     (SELECT id FROM locations WHERE code='HQ'),   'retired',   'SN-PRJ-0007', 'EB-X05',       'Epson',   '2021-02-01',  45000, '2023-02-01', (SELECT id FROM users WHERE email='admin@assetflow.io'));

-- lifecycle history for the retired asset
INSERT INTO asset_status_history (asset_id, from_status, to_status, reason, changed_by) VALUES
  ((SELECT id FROM assets WHERE asset_tag='AST-2021-0010'), 'available', 'retired', 'End of life — lamp failure, repair uneconomical', (SELECT id FROM users WHERE email='admin@assetflow.io'));

-- ---------- resources ----------
INSERT INTO resources (name, code, resource_type, location_id, capacity, description) VALUES
  ('Boardroom Alpha',   'RES-001', 'meeting_room', (SELECT id FROM locations WHERE code='HQ'),  14, 'Video conferencing, whiteboard'),
  ('Huddle Room Beta',  'RES-002', 'meeting_room', (SELECT id FROM locations WHERE code='BLR'),  6, 'Small huddle space'),
  ('Pool Car — Innova', 'RES-003', 'vehicle',      (SELECT id FROM locations WHERE code='HQ'),   7, 'Bookable pool vehicle'),
  ('DSLR Camera Kit',   'RES-004', 'equipment',    (SELECT id FROM locations WHERE code='HQ'),   1, 'Canon EOS + lenses'),
  ('Hot Desk Bay 3',    'RES-005', 'workspace',    (SELECT id FROM locations WHERE code='BLR'),  1, 'Visitor hot desk');

-- ---------- sample bookings (future-dated relative to seed time) ----------
INSERT INTO bookings (resource_id, booked_by, purpose, starts_at, ends_at, status) VALUES
  ((SELECT id FROM resources WHERE code='RES-001'), (SELECT id FROM users WHERE email='manager@assetflow.io'),
   'Quarterly planning', now() + interval '1 day',  now() + interval '1 day 2 hours', 'confirmed'),
  ((SELECT id FROM resources WHERE code='RES-002'), (SELECT id FROM users WHERE email='employee@assetflow.io'),
   'Sprint retro',       now() + interval '2 days', now() + interval '2 days 1 hour', 'confirmed');

-- ---------- sample maintenance request (pending approval) ----------
INSERT INTO maintenance_requests (asset_id, title, description, priority, status, maintenance_type, reported_by) VALUES
  ((SELECT id FROM assets WHERE asset_tag='AST-2024-0005'),
   'Paper jam and streaky prints', 'Repeated jams on tray 2; fuser may need service.',
   'high', 'pending', 'corrective', (SELECT id FROM users WHERE email='employee@assetflow.io'));

-- ---------- welcome notifications ----------
INSERT INTO notifications (user_id, title, message, n_type)
SELECT id, 'Welcome to AssetFlow', 'Your account is ready. Explore the dashboard to get started.', 'info' FROM users;

COMMIT;

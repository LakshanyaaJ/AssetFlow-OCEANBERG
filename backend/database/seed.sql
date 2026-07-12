-- ============================================================
-- AssetFlow ERP — Seed Data
-- All demo users share the password: Password@123
-- (hash generated with bcrypt, cost 10)
--
-- Layout:
--   1. Roles / permissions / role_permissions      (fixed RBAC matrix)
--   2. Users                                        (11 logins across every role)
--   3. Organization: departments, locations, employees (34 employees)
--   4. Asset categories (4 top-level + 13 sub-categories)
--   5. Resources (bookable rooms/vehicles/equipment)
--   6. Assets — generated across every category/location/status
--   7. Allocation history — active + returned, incl. overdue examples
--   8. Transfer requests — open + historical
--   9. Bookings — past (completed), upcoming (confirmed), a cancellation
--  10. Maintenance requests + assignments — spread across months
--  11. Audit cycles + items — completed / in-progress / draft / cancelled
--  12. Notifications — mixed types, read/unread
--  13. Activity log — historical trail for dashboards/reports
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ROLES / PERMISSIONS
-- ============================================================

INSERT INTO roles (name, description, is_system) VALUES
  ('admin',      'Full system access',                          true),
  ('manager',    'Approves transfers/maintenance, manages assets', true),
  ('employee',   'Requests assets, books resources',            true),
  ('technician', 'Executes maintenance work orders',            true),
  ('auditor',    'Runs physical audit cycles',                  true);

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

-- ============================================================
-- 2. USERS (password: Password@123 for all)
-- ============================================================

INSERT INTO users (email, password_hash, full_name, role_id) VALUES
  ('admin@assetflow.io',     '$2a$10$g7FQUqX1iDBmCippGfMzD.EPQpcvrXTGPRbuvHQLOZ.POxmLJH/WW', 'Ava Administrator', (SELECT id FROM roles WHERE name='admin')),
  ('manager@assetflow.io',   '$2a$10$g7FQUqX1iDBmCippGfMzD.EPQpcvrXTGPRbuvHQLOZ.POxmLJH/WW', 'Miles Manager',     (SELECT id FROM roles WHERE name='manager')),
  ('employee@assetflow.io',  '$2a$10$g7FQUqX1iDBmCippGfMzD.EPQpcvrXTGPRbuvHQLOZ.POxmLJH/WW', 'Elena Employee',    (SELECT id FROM roles WHERE name='employee')),
  ('tech@assetflow.io',      '$2a$10$g7FQUqX1iDBmCippGfMzD.EPQpcvrXTGPRbuvHQLOZ.POxmLJH/WW', 'Theo Technician',   (SELECT id FROM roles WHERE name='technician')),
  ('auditor@assetflow.io',   '$2a$10$g7FQUqX1iDBmCippGfMzD.EPQpcvrXTGPRbuvHQLOZ.POxmLJH/WW', 'Aria Auditor',      (SELECT id FROM roles WHERE name='auditor')),
  ('rohan.verma@assetflow.io',  '$2a$10$g7FQUqX1iDBmCippGfMzD.EPQpcvrXTGPRbuvHQLOZ.POxmLJH/WW', 'Rohan Verma',  (SELECT id FROM roles WHERE name='manager')),
  ('kavya.iyer@assetflow.io',   '$2a$10$g7FQUqX1iDBmCippGfMzD.EPQpcvrXTGPRbuvHQLOZ.POxmLJH/WW', 'Kavya Iyer',   (SELECT id FROM roles WHERE name='manager')),
  ('aditya.rao@assetflow.io',   '$2a$10$g7FQUqX1iDBmCippGfMzD.EPQpcvrXTGPRbuvHQLOZ.POxmLJH/WW', 'Aditya Rao',   (SELECT id FROM roles WHERE name='employee')),
  ('neha.gupta@assetflow.io',   '$2a$10$g7FQUqX1iDBmCippGfMzD.EPQpcvrXTGPRbuvHQLOZ.POxmLJH/WW', 'Neha Gupta',   (SELECT id FROM roles WHERE name='employee')),
  ('farhan.sheikh@assetflow.io','$2a$10$g7FQUqX1iDBmCippGfMzD.EPQpcvrXTGPRbuvHQLOZ.POxmLJH/WW', 'Farhan Sheikh',(SELECT id FROM roles WHERE name='technician')),
  ('meera.nair@assetflow.io',   '$2a$10$g7FQUqX1iDBmCippGfMzD.EPQpcvrXTGPRbuvHQLOZ.POxmLJH/WW', 'Meera Nair',   (SELECT id FROM roles WHERE name='auditor'));

-- ============================================================
-- 3. ORGANIZATION
-- ============================================================

INSERT INTO departments (name, code, description) VALUES
  ('Engineering',      'ENG',   'Product engineering'),
  ('Product',          'PROD',  'Product management'),
  ('Design',           'DES',   'Product and brand design'),
  ('Operations',       'OPS',   'Facilities and operations'),
  ('Finance',          'FIN',   'Finance and accounting'),
  ('Human Resources',  'HR',    'People operations'),
  ('Sales',            'SALES', 'Field and inside sales'),
  ('IT Support',       'ITS',   'Internal IT helpdesk and infrastructure');

INSERT INTO locations (name, code, address, city) VALUES
  ('Headquarters',           'HQ',   '12 Marine Drive',       'Mumbai'),
  ('Bengaluru Office',       'BLR',  '44 MG Road',             'Bengaluru'),
  ('Pune Warehouse',         'PUNE', 'Plot 7, MIDC',           'Pune'),
  ('Delhi Branch',           'DEL',  '9 Connaught Place',      'New Delhi'),
  ('Hyderabad Tech Park',    'HYD',  'Block C, HITEC City',    'Hyderabad');

INSERT INTO locations (name, code, address, city, parent_id) VALUES
  ('HQ — Engineering Wing (3rd Floor)', 'HQ-ENG', '12 Marine Drive, 3rd Floor', 'Mumbai', (SELECT id FROM locations WHERE code='HQ')),
  ('HQ — Admin Block (Ground Floor)',   'HQ-ADM', '12 Marine Drive, Ground Floor', 'Mumbai', (SELECT id FROM locations WHERE code='HQ'));

INSERT INTO employees (user_id, employee_code, full_name, designation, phone, department_id, location_id, joined_on, is_active) VALUES
  ((SELECT id FROM users WHERE email='manager@assetflow.io'),      'EMP-001', 'Miles Manager',   'Operations Manager',    '+91-9800000001', (SELECT id FROM departments WHERE code='OPS'),   (SELECT id FROM locations WHERE code='HQ'),     '2022-04-01', true),
  ((SELECT id FROM users WHERE email='employee@assetflow.io'),     'EMP-002', 'Elena Employee',  'Software Engineer',     '+91-9800000002', (SELECT id FROM departments WHERE code='ENG'),   (SELECT id FROM locations WHERE code='BLR'),    '2023-07-15', true),
  ((SELECT id FROM users WHERE email='tech@assetflow.io'),         'EMP-003', 'Theo Technician', 'Service Technician',    '+91-9800000003', (SELECT id FROM departments WHERE code='OPS'),   (SELECT id FROM locations WHERE code='HQ'),     '2021-11-20', true),
  ((SELECT id FROM users WHERE email='auditor@assetflow.io'),      'EMP-004', 'Aria Auditor',    'Internal Auditor',      '+91-9800000004', (SELECT id FROM departments WHERE code='FIN'),   (SELECT id FROM locations WHERE code='HQ'),     '2022-09-05', true),
  (NULL,                                                            'EMP-005', 'Ravi Kumar',      'QA Engineer',           '+91-9800000005', (SELECT id FROM departments WHERE code='ENG'),   (SELECT id FROM locations WHERE code='BLR'),    '2024-01-10', true),
  (NULL,                                                            'EMP-006', 'Sana Sheikh',     'HR Generalist',         '+91-9800000006', (SELECT id FROM departments WHERE code='HR'),    (SELECT id FROM locations WHERE code='HQ'),     '2023-03-22', true),
  ((SELECT id FROM users WHERE email='rohan.verma@assetflow.io'),  'EMP-007', 'Rohan Verma',     'Sales Manager',         '+91-9800000007', (SELECT id FROM departments WHERE code='SALES'), (SELECT id FROM locations WHERE code='DEL'),    '2021-06-14', true),
  ((SELECT id FROM users WHERE email='kavya.iyer@assetflow.io'),   'EMP-008', 'Kavya Iyer',      'Engineering Manager',   '+91-9800000008', (SELECT id FROM departments WHERE code='ENG'),   (SELECT id FROM locations WHERE code='HYD'),    '2020-08-03', true),
  ((SELECT id FROM users WHERE email='aditya.rao@assetflow.io'),   'EMP-009', 'Aditya Rao',      'Product Analyst',       '+91-9800000009', (SELECT id FROM departments WHERE code='PROD'),  (SELECT id FROM locations WHERE code='BLR'),    '2023-02-27', true),
  ((SELECT id FROM users WHERE email='neha.gupta@assetflow.io'),   'EMP-010', 'Neha Gupta',      'UX Designer',           '+91-9800000010', (SELECT id FROM departments WHERE code='DES'),   (SELECT id FROM locations WHERE code='HQ'),     '2022-11-11', true),
  ((SELECT id FROM users WHERE email='farhan.sheikh@assetflow.io'),'EMP-011', 'Farhan Sheikh',   'Field Technician',      '+91-9800000011', (SELECT id FROM departments WHERE code='ITS'),   (SELECT id FROM locations WHERE code='PUNE'),   '2021-05-19', true),
  ((SELECT id FROM users WHERE email='meera.nair@assetflow.io'),   'EMP-012', 'Meera Nair',      'Compliance Auditor',    '+91-9800000012', (SELECT id FROM departments WHERE code='FIN'),   (SELECT id FROM locations WHERE code='DEL'),    '2022-01-30', true),
  (NULL, 'EMP-013', 'Arjun Nair',      'Senior Software Engineer', '+91-9800000013', (SELECT id FROM departments WHERE code='ENG'),   (SELECT id FROM locations WHERE code='HQ-ENG'), '2021-03-08', true),
  (NULL, 'EMP-014', 'Priya Shah',      'DevOps Engineer',          '+91-9800000014', (SELECT id FROM departments WHERE code='ENG'),   (SELECT id FROM locations WHERE code='BLR'),    '2022-06-21', true),
  (NULL, 'EMP-015', 'Vikram Singh',    'Warehouse Supervisor',     '+91-9800000015', (SELECT id FROM departments WHERE code='OPS'),   (SELECT id FROM locations WHERE code='PUNE'),   '2020-02-17', true),
  (NULL, 'EMP-016', 'Sneha Reddy',     'Business Analyst',         '+91-9800000016', (SELECT id FROM departments WHERE code='PROD'),  (SELECT id FROM locations WHERE code='HYD'),    '2023-09-04', true),
  (NULL, 'EMP-017', 'Karan Malhotra',  'Account Manager',          '+91-9800000017', (SELECT id FROM departments WHERE code='SALES'), (SELECT id FROM locations WHERE code='DEL'),    '2021-12-01', true),
  (NULL, 'EMP-018', 'Ananya Desai',    'Finance Analyst',          '+91-9800000018', (SELECT id FROM departments WHERE code='FIN'),   (SELECT id FROM locations WHERE code='HQ-ADM'), '2022-08-15', true),
  (NULL, 'EMP-019', 'Rahul Joshi',     'IT Support Specialist',    '+91-9800000019', (SELECT id FROM departments WHERE code='ITS'),   (SELECT id FROM locations WHERE code='HQ'),     '2024-04-22', true),
  (NULL, 'EMP-020', 'Ishita Kapoor',   'HR Executive',             '+91-9800000020', (SELECT id FROM departments WHERE code='HR'),    (SELECT id FROM locations WHERE code='HQ'),     '2023-01-09', true),
  (NULL, 'EMP-021', 'Aditi Bhatt',     'Product Designer',         '+91-9800000021', (SELECT id FROM departments WHERE code='DES'),   (SELECT id FROM locations WHERE code='BLR'),    '2021-10-05', true),
  (NULL, 'EMP-022', 'Sameer Khan',     'Sales Executive',          '+91-9800000022', (SELECT id FROM departments WHERE code='SALES'), (SELECT id FROM locations WHERE code='HYD'),    '2024-02-12', true),
  (NULL, 'EMP-023', 'Pooja Mehta',     'Software Engineer',        '+91-9800000023', (SELECT id FROM departments WHERE code='ENG'),   (SELECT id FROM locations WHERE code='HQ-ENG'), '2022-05-30', true),
  (NULL, 'EMP-024', 'Nikhil Chawla',   'Procurement Officer',      '+91-9800000024', (SELECT id FROM departments WHERE code='OPS'),   (SELECT id FROM locations WHERE code='HQ'),     '2021-07-19', true),
  (NULL, 'EMP-025', 'Divya Pillai',    'Marketing Executive',      '+91-9800000025', (SELECT id FROM departments WHERE code='SALES'), (SELECT id FROM locations WHERE code='BLR'),    '2023-11-27', true),
  (NULL, 'EMP-026', 'Manish Agarwal',  'Data Analyst',             '+91-9800000026', (SELECT id FROM departments WHERE code='PROD'),  (SELECT id FROM locations WHERE code='HQ'),     '2022-03-14', true),
  (NULL, 'EMP-027', 'Tanvi Kulkarni',  'Legal Counsel',            '+91-9800000027', (SELECT id FROM departments WHERE code='FIN'),   (SELECT id FROM locations WHERE code='HQ-ADM'), '2020-09-01', true),
  (NULL, 'EMP-028', 'Yash Trivedi',    'Facilities Coordinator',   '+91-9800000028', (SELECT id FROM departments WHERE code='OPS'),   (SELECT id FROM locations WHERE code='PUNE'),   '2024-06-08', true),
  (NULL, 'EMP-029', 'Ritika Bose',     'Executive Assistant',      '+91-9800000029', (SELECT id FROM departments WHERE code='HR'),    (SELECT id FROM locations WHERE code='HQ'),     '2023-04-17', true),
  (NULL, 'EMP-030', 'Suresh Pillai',   'Customer Success Manager', '+91-9800000030', (SELECT id FROM departments WHERE code='SALES'), (SELECT id FROM locations WHERE code='DEL'),    '2021-01-25', true),
  (NULL, 'EMP-031', 'Anjali Menon',    'QA Engineer',              '+91-9800000031', (SELECT id FROM departments WHERE code='ENG'),   (SELECT id FROM locations WHERE code='HYD'),    '2022-12-19', true),
  (NULL, 'EMP-032', 'Gaurav Saxena',   'IT Support Specialist',    '+91-9800000032', (SELECT id FROM departments WHERE code='ITS'),   (SELECT id FROM locations WHERE code='BLR'),    '2020-05-11', false),
  (NULL, 'EMP-033', 'Lakshmi Narayan', 'Finance Analyst',          '+91-9800000033', (SELECT id FROM departments WHERE code='FIN'),   (SELECT id FROM locations WHERE code='HQ'),     '2021-08-23', false),
  (NULL, 'EMP-034', 'Zoya Ahmed',      'Product Manager',          '+91-9800000034', (SELECT id FROM departments WHERE code='PROD'),  (SELECT id FROM locations WHERE code='HQ'),     '2023-06-06', false);

-- ============================================================
-- 4. ASSET CATEGORIES (4 top-level + 13 sub-categories)
-- ============================================================

INSERT INTO asset_categories (name, code, depreciation_rate, description) VALUES
  ('IT Equipment',     'IT',   33.33, 'Computing hardware'),
  ('Office Furniture', 'FURN', 10.00, 'Desks, chairs, cabinets'),
  ('Vehicles',         'VEH',  15.00, 'Company vehicles'),
  ('Machinery',        'MACH', 20.00, 'Warehouse machinery');

INSERT INTO asset_categories (name, code, parent_id, depreciation_rate, description) VALUES
  ('Laptops',              'IT-LAP', (SELECT id FROM asset_categories WHERE code='IT'),   33.33, 'Portable computers'),
  ('Monitors',             'IT-MON', (SELECT id FROM asset_categories WHERE code='IT'),   25.00, 'Displays'),
  ('Printers',             'IT-PRN', (SELECT id FROM asset_categories WHERE code='IT'),   25.00, 'Print devices'),
  ('Desktops',             'IT-DSK', (SELECT id FROM asset_categories WHERE code='IT'),   25.00, 'Desktop workstations'),
  ('Tablets',              'IT-TAB', (SELECT id FROM asset_categories WHERE code='IT'),   33.33, 'Tablets and handhelds'),
  ('Networking Equipment', 'IT-NET', (SELECT id FROM asset_categories WHERE code='IT'),   20.00, 'Switches, routers, access points'),
  ('Desks',                'FURN-DSK', (SELECT id FROM asset_categories WHERE code='FURN'), 10.00, 'Workstation desks'),
  ('Chairs',               'FURN-CHR', (SELECT id FROM asset_categories WHERE code='FURN'), 10.00, 'Office seating'),
  ('Cabinets',             'FURN-CAB', (SELECT id FROM asset_categories WHERE code='FURN'), 8.00,  'Storage cabinets'),
  ('Cars',                 'VEH-CAR', (SELECT id FROM asset_categories WHERE code='VEH'),  15.00, 'Company cars'),
  ('Two Wheelers',         'VEH-2W',  (SELECT id FROM asset_categories WHERE code='VEH'),  15.00, 'Company motorcycles/scooters'),
  ('Forklifts',            'MACH-FLT',(SELECT id FROM asset_categories WHERE code='MACH'), 20.00, 'Material handling equipment'),
  ('Generators',           'MACH-GEN',(SELECT id FROM asset_categories WHERE code='MACH'), 18.00, 'Backup power generators');

-- ============================================================
-- 5. RESOURCES
-- ============================================================

INSERT INTO resources (name, code, resource_type, location_id, capacity, description) VALUES
  ('Boardroom Alpha',    'RES-001', 'meeting_room', (SELECT id FROM locations WHERE code='HQ'),   14, 'Video conferencing, whiteboard'),
  ('Huddle Room Beta',   'RES-002', 'meeting_room', (SELECT id FROM locations WHERE code='BLR'),   6, 'Small huddle space'),
  ('Pool Car — Innova',  'RES-003', 'vehicle',      (SELECT id FROM locations WHERE code='HQ'),    7, 'Bookable pool vehicle'),
  ('DSLR Camera Kit',    'RES-004', 'equipment',    (SELECT id FROM locations WHERE code='HQ'),    1, 'Canon EOS + lenses'),
  ('Hot Desk Bay 3',     'RES-005', 'workspace',    (SELECT id FROM locations WHERE code='BLR'),   1, 'Visitor hot desk'),
  ('Conference Room Delta','RES-006','meeting_room', (SELECT id FROM locations WHERE code='DEL'),  10, 'Client-facing conference room'),
  ('Training Lab',       'RES-007', 'workspace',    (SELECT id FROM locations WHERE code='HYD'),   20, 'Hands-on training lab'),
  ('Pool Car — Ertiga',  'RES-008', 'vehicle',      (SELECT id FROM locations WHERE code='PUNE'),   7, 'Warehouse pool vehicle');

COMMIT;

-- ============================================================
-- 6. ASSETS — generated across every category/location, with a
--    realistic status mix (available/allocated/maintenance/
--    transfer/retired/lost) driven off a deterministic bucket
--    so downstream allocation/maintenance/transfer rows can key
--    off `status` without any risk of contradicting it.
-- ============================================================

BEGIN;

DO $$
DECLARE
  admin_id   INT := (SELECT id FROM users WHERE email='admin@assetflow.io');
  loc_codes  TEXT[] := ARRAY['HQ','BLR','PUNE','DEL','HYD','HQ-ENG','HQ-ADM'];
  i          INT;
  n_pool     INT;
  p          RECORD;
  v_cat_id   INT;
  v_loc_id   INT;
  v_status   TEXT;
  v_bucket   INT;
  v_purchase DATE;
  v_warranty DATE;
  v_cost     NUMERIC;
  v_tag      TEXT;
  v_serial   TEXT;
BEGIN
  -- Pool of realistic (category, name, model, vendor, base_cost, electronic?) combos.
  CREATE TEMP TABLE cat_pool (
    id SERIAL PRIMARY KEY,
    category_code TEXT, name TEXT, model TEXT, vendor TEXT,
    base_cost NUMERIC, is_electronic BOOLEAN
  ) ON COMMIT DROP;

  INSERT INTO cat_pool (category_code, name, model, vendor, base_cost, is_electronic) VALUES
    ('IT-LAP','MacBook Pro 14" M3',            'A2918',          'Apple',          189000, true),
    ('IT-LAP','Dell Latitude 5440',            'Latitude 5440',  'Dell',            92000, true),
    ('IT-LAP','ThinkPad X1 Carbon Gen 11',     'X1 Gen 11',      'Lenovo',         145000, true),
    ('IT-LAP','HP EliteBook 840 G10',          '840 G10',        'HP',             110000, true),
    ('IT-MON','Dell UltraSharp U2723QE',       'U2723QE',        'Dell',            52000, true),
    ('IT-MON','LG 27UL850 4K Monitor',         '27UL850',        'LG',              38000, true),
    ('IT-MON','Samsung Odyssey G5',            'G5',             'Samsung',         29000, true),
    ('IT-PRN','HP LaserJet Pro M428',          'M428fdw',        'HP',              38000, true),
    ('IT-PRN','Canon imageCLASS MF264dw',      'MF264dw',        'Canon',           22000, true),
    ('IT-DSK','Dell OptiPlex 7010',            'OptiPlex 7010',  'Dell',            68000, true),
    ('IT-DSK','HP ProDesk 400 G9',             'ProDesk 400 G9', 'HP',              59000, true),
    ('IT-TAB','iPad Air 5th Gen',              'A2588',          'Apple',           61900, true),
    ('IT-TAB','Samsung Galaxy Tab S9',         'SM-X710',        'Samsung',         54999, true),
    ('IT-NET','Cisco Catalyst 9200 Switch',    'C9200-24T',      'Cisco',          185000, true),
    ('IT-NET','Ubiquiti UniFi Dream Machine Pro','UDM-Pro',      'Ubiquiti',        45000, true),
    ('FURN-DSK','Height-Adjustable Desk 160cm','Jarvis',         'Fully',           42000, false),
    ('FURN-DSK','Executive Office Desk',       'EOD-180',        'Godrej Interio',  35000, false),
    ('FURN-CHR','Ergonomic Mesh Chair',        'Aeron',          'Herman Miller',   65000, false),
    ('FURN-CHR','Task Chair Deluxe',           'TC-220',         'Featherlite',     18000, false),
    ('FURN-CAB','Steel Filing Cabinet 4-Drawer','SFC-4D',        'Godrej',          15500, false),
    ('VEH-CAR','Toyota Innova Crysta',         'Crysta 2.4',     'Toyota',        2100000, true),
    ('VEH-CAR','Maruti Suzuki Ertiga',         'Ertiga ZXI',     'Maruti Suzuki', 1150000, true),
    ('VEH-2W','Honda Activa 6G',               'Activa 6G',      'Honda',           85000, true),
    ('MACH-FLT','Electric Forklift 2T',        'GX-200',         'Godrej',        1250000, true),
    ('MACH-GEN','Diesel Generator 62.5 kVA',   'DG-62.5',        'Kirloskar',      875000, true);

  SELECT count(*) INTO n_pool FROM cat_pool;

  FOR i IN 1..96 LOOP
    SELECT * INTO p FROM cat_pool WHERE id = ((i - 1) % n_pool) + 1;
    SELECT id INTO v_cat_id FROM asset_categories WHERE code = p.category_code;
    SELECT id INTO v_loc_id FROM locations WHERE code = loc_codes[1 + ((i - 1) % array_length(loc_codes, 1))];

    v_bucket := i % 20;
    v_status := CASE
      WHEN v_bucket <= 10 THEN 'available'
      WHEN v_bucket <= 15 THEN 'allocated'
      WHEN v_bucket <= 17 THEN 'under_maintenance'
      WHEN v_bucket = 18  THEN 'in_transfer'
      ELSE 'retired'
    END;

    v_purchase := DATE '2021-06-01' + (((i * 37) % 1500) || ' days')::interval;
    v_cost     := round(p.base_cost * (0.9 + (i % 5) * 0.05), 2);
    v_warranty := CASE WHEN p.is_electronic THEN v_purchase + interval '3 years' ELSE NULL END;
    v_tag      := 'AST-' || extract(year FROM v_purchase) || '-' || lpad(i::text, 4, '0');
    v_serial   := p.category_code || '-' || lpad(i::text, 5, '0');

    INSERT INTO assets (asset_tag, name, category_id, location_id, status, serial_number, model, vendor,
                         purchase_date, purchase_cost, warranty_expiry, description, created_by)
    VALUES (v_tag, p.name, v_cat_id, v_loc_id, v_status, v_serial, p.model, p.vendor,
            v_purchase, v_cost, v_warranty,
            p.name || ' — procured for ' || (SELECT name FROM locations WHERE id = v_loc_id), admin_id);
  END LOOP;

  -- A couple of assets that are simply lost (misplaced during a move / write-off candidates).
  UPDATE assets SET status = 'lost'
  WHERE id IN (SELECT id FROM assets WHERE status = 'available' ORDER BY id LIMIT 2 OFFSET 15);
END $$;

-- Lifecycle history for every retired/lost asset (immutable audit trail).
INSERT INTO asset_status_history (asset_id, from_status, to_status, reason, changed_by, changed_at)
SELECT id, 'available', 'retired',
       'End of life — replaced under refresh cycle',
       (SELECT id FROM users WHERE email='admin@assetflow.io'),
       updated_at
FROM assets WHERE status = 'retired';

INSERT INTO asset_status_history (asset_id, from_status, to_status, reason, changed_by, changed_at)
SELECT id, 'available', 'lost',
       'Not found during physical verification — flagged for write-off',
       (SELECT id FROM users WHERE email='auditor@assetflow.io'),
       updated_at
FROM assets WHERE status = 'lost';

COMMIT;

-- ============================================================
-- 7. ALLOCATIONS — one active allocation per 'allocated' asset
--    (a few intentionally overdue), plus returned history layered
--    on 'available' assets so trend views have real depth.
-- ============================================================

BEGIN;

DO $$
DECLARE
  a          RECORD;
  emp_ids    INT[] := ARRAY(SELECT id FROM employees WHERE is_active = true ORDER BY id);
  n_emp      INT;
  i          INT := 0;
  v_emp_id   INT;
  v_allocated_at TIMESTAMPTZ;
  v_due_at   TIMESTAMPTZ;
  admin_id   INT := (SELECT id FROM users WHERE email='admin@assetflow.io');
  manager_id INT := (SELECT id FROM users WHERE email='manager@assetflow.io');
BEGIN
  n_emp := array_length(emp_ids, 1);

  FOR a IN SELECT id FROM assets WHERE status = 'allocated' ORDER BY id LOOP
    i := i + 1;
    v_emp_id := emp_ids[1 + (i % n_emp)];
    v_allocated_at := now() - ((10 + (i * 5) % 90) || ' days')::interval;
    v_due_at := CASE WHEN i % 6 = 0 THEN now() - ((2 + i % 5) || ' days')::interval
                     ELSE v_allocated_at + ((15 + (i * 7) % 60) || ' days')::interval END;
    INSERT INTO asset_allocations (asset_id, employee_id, allocated_by, allocated_at, due_at)
    VALUES (a.id, v_emp_id, CASE WHEN i % 3 = 0 THEN manager_id ELSE admin_id END, v_allocated_at, v_due_at);
  END LOOP;

  i := 0;
  FOR a IN SELECT id FROM assets WHERE status = 'available' ORDER BY id LIMIT 24 LOOP
    i := i + 1;
    v_emp_id := emp_ids[1 + (i % n_emp)];
    v_allocated_at := now() - ((120 + i * 11) || ' days')::interval;
    INSERT INTO asset_allocations (asset_id, employee_id, allocated_by, allocated_at, due_at, returned_at, return_condition)
    VALUES (a.id, v_emp_id, admin_id, v_allocated_at, v_allocated_at + interval '45 days',
            v_allocated_at + ((20 + i * 3) || ' days')::interval,
            CASE WHEN i % 9 = 0 THEN 'needs_repair' WHEN i % 5 = 0 THEN 'damaged' ELSE 'good' END);
  END LOOP;
END $$;

COMMIT;

-- ============================================================
-- 8. TRANSFER REQUESTS — open transfers backing every 'in_transfer'
--    asset, plus historical completed/rejected/cancelled ones.
-- ============================================================

BEGIN;

DO $$
DECLARE
  a            RECORD;
  loc_ids      INT[] := ARRAY(SELECT id FROM locations ORDER BY id);
  n_loc        INT;
  i            INT := 0;
  v_to_loc     INT;
  admin_id     INT := (SELECT id FROM users WHERE email='admin@assetflow.io');
  manager_id   INT := (SELECT id FROM users WHERE email='manager@assetflow.io');
  employee_uid INT := (SELECT id FROM users WHERE email='employee@assetflow.io');
BEGIN
  n_loc := array_length(loc_ids, 1);

  FOR a IN SELECT id, location_id FROM assets WHERE status = 'in_transfer' ORDER BY id LOOP
    i := i + 1;
    v_to_loc := loc_ids[1 + (i % n_loc)];
    IF v_to_loc = a.location_id THEN v_to_loc := loc_ids[1 + ((i + 1) % n_loc)]; END IF;
    INSERT INTO transfer_requests (asset_id, from_location_id, to_location_id, status, reason, requested_by, decided_by, decided_at, requested_at)
    VALUES (a.id, a.location_id, v_to_loc,
            CASE WHEN i % 2 = 0 THEN 'approved' ELSE 'pending' END,
            'Relocation to balance regional inventory',
            employee_uid,
            CASE WHEN i % 2 = 0 THEN manager_id ELSE NULL END,
            CASE WHEN i % 2 = 0 THEN now() - interval '1 day' ELSE NULL END,
            now() - ((2 + i) || ' days')::interval);
  END LOOP;

  i := 0;
  FOR a IN SELECT id, location_id FROM assets WHERE status IN ('available','allocated') ORDER BY id LIMIT 12 LOOP
    i := i + 1;
    v_to_loc := loc_ids[1 + (i % n_loc)];
    IF v_to_loc = a.location_id THEN v_to_loc := loc_ids[1 + ((i + 1) % n_loc)]; END IF;
    INSERT INTO transfer_requests (asset_id, from_location_id, to_location_id, status, reason, requested_by, decided_by, decided_at, completed_at, requested_at)
    VALUES (a.id, v_to_loc, a.location_id,
            (ARRAY['completed','completed','rejected','cancelled'])[1 + (i % 4)],
            'Department relocation request',
            admin_id, manager_id,
            now() - ((30 + i * 4) || ' days')::interval,
            CASE WHEN i % 4 < 2 THEN now() - ((28 + i * 4) || ' days')::interval ELSE NULL END,
            now() - ((40 + i * 4) || ' days')::interval);
  END LOOP;
END $$;

COMMIT;

-- ============================================================
-- 9. BOOKINGS — past (completed), upcoming (confirmed, non-
--    overlapping per resource), and one cancelled booking.
-- ============================================================

BEGIN;

DO $$
DECLARE
  r         RECORD;
  i         INT;
  v_start   TIMESTAMPTZ;
  v_end     TIMESTAMPTZ;
  user_ids  INT[] := ARRAY(SELECT id FROM users ORDER BY id);
  n_users   INT;
  purposes  TEXT[] := ARRAY['Quarterly planning','Sprint retro','Client demo','1:1 sync','Vendor call',
                             'Team offsite prep','Interview panel','Budget review','Design critique','All-hands rehearsal'];
BEGIN
  n_users := array_length(user_ids, 1);

  FOR r IN SELECT id FROM resources ORDER BY id LOOP
    FOR i IN 1..4 LOOP
      v_start := now() - ((30 - i * 6) || ' days')::interval;
      v_end   := v_start + interval '1 hour';
      INSERT INTO bookings (resource_id, booked_by, purpose, starts_at, ends_at, status)
      VALUES (r.id, user_ids[1 + ((r.id + i) % n_users)], purposes[1 + ((r.id + i) % array_length(purposes,1))], v_start, v_end, 'completed');
    END LOOP;
    FOR i IN 1..3 LOOP
      v_start := now() + ((i * 2) || ' days')::interval + ((r.id) || ' hours')::interval;
      v_end   := v_start + interval '90 minutes';
      INSERT INTO bookings (resource_id, booked_by, purpose, starts_at, ends_at, status)
      VALUES (r.id, user_ids[1 + ((r.id + i + 3) % n_users)], purposes[1 + ((r.id + i + 3) % array_length(purposes,1))], v_start, v_end, 'confirmed');
    END LOOP;
  END LOOP;

  INSERT INTO bookings (resource_id, booked_by, purpose, starts_at, ends_at, status)
  SELECT id, (SELECT id FROM users WHERE email='employee@assetflow.io'), 'Cancelled — venue change',
         now() + interval '3 days', now() + interval '3 days 1 hour', 'cancelled'
  FROM resources WHERE code = 'RES-001';
END $$;

COMMIT;

-- ============================================================
-- 10. MAINTENANCE REQUESTS + ASSIGNMENTS — active work orders
--     backing every 'under_maintenance' asset, plus historical
--     tickets spread across months for trend/cost reporting.
-- ============================================================

BEGIN;

DO $$
DECLARE
  a            RECORD;
  i            INT := 0;
  tech_ids     INT[] := ARRAY(SELECT id FROM employees WHERE employee_code IN ('EMP-003','EMP-011') ORDER BY employee_code);
  admin_id     INT := (SELECT id FROM users WHERE email='admin@assetflow.io');
  manager_id   INT := (SELECT id FROM users WHERE email='manager@assetflow.io');
  employee_uid INT := (SELECT id FROM users WHERE email='employee@assetflow.io');
  v_req_id     INT;
  titles       TEXT[] := ARRAY['Unusual noise during operation','Paper jam and streaky prints','Battery not holding charge',
                                'Screen flickering intermittently','AC unit not cooling','Software update required',
                                'Brake inspection due','Annual service due','Cracked casing needs replacement','Overheating under load'];
BEGIN
  FOR a IN SELECT id FROM assets WHERE status = 'under_maintenance' ORDER BY id LOOP
    i := i + 1;
    INSERT INTO maintenance_requests (asset_id, title, description, priority, status, maintenance_type,
                                       reported_by, decided_by, scheduled_for, requested_at, decided_at)
    VALUES (a.id, titles[1 + (i % array_length(titles,1))], 'Reported via routine inspection; needs technician attention.',
            CASE WHEN i % 4 = 0 THEN 'critical' WHEN i % 3 = 0 THEN 'high' ELSE 'medium' END,
            'in_progress', CASE WHEN i % 2 = 0 THEN 'preventive' ELSE 'corrective' END,
            employee_uid, manager_id, current_date + (i % 5), now() - ((5 + i) || ' days')::interval, now() - ((4 + i) || ' days')::interval)
    RETURNING id INTO v_req_id;

    INSERT INTO maintenance_assignments (maintenance_request_id, assigned_to, assigned_by, notes)
    VALUES (v_req_id, tech_ids[1 + (i % array_length(tech_ids,1))], manager_id, 'Please prioritise — asset is offline until resolved.');
  END LOOP;

  i := 0;
  FOR a IN SELECT id FROM assets WHERE status IN ('available','allocated','retired') ORDER BY id LIMIT 22 LOOP
    i := i + 1;
    INSERT INTO maintenance_requests (asset_id, title, description, priority, status, maintenance_type, cost, resolution,
                                       reported_by, decided_by, scheduled_for, requested_at, decided_at, completed_at)
    VALUES (
      a.id, titles[1 + (i % array_length(titles,1))], 'Routine maintenance ticket.',
      (ARRAY['low','medium','high','critical'])[1 + (i % 4)],
      (ARRAY['pending','rejected','completed','completed','completed','cancelled'])[1 + (i % 6)],
      CASE WHEN i % 3 = 0 THEN 'preventive' ELSE 'corrective' END,
      CASE WHEN (i % 6) IN (2,3,4) THEN round((1500 + (i * 733) % 20000)::numeric, 2) ELSE NULL END,
      CASE WHEN (i % 6) IN (2,3,4) THEN 'Serviced and returned to service.' ELSE NULL END,
      employee_uid, CASE WHEN (i % 6) <> 0 THEN admin_id ELSE NULL END,
      current_date - (60 - i * 2),
      now() - ((90 - i * 2) || ' days')::interval,
      CASE WHEN (i % 6) <> 0 THEN now() - ((85 - i * 2) || ' days')::interval ELSE NULL END,
      CASE WHEN (i % 6) IN (2,3,4) THEN now() - ((70 - i * 2) || ' days')::interval ELSE NULL END
    );
  END LOOP;
END $$;

COMMIT;

-- ============================================================
-- 11. AUDIT CYCLES + ITEMS — completed / in-progress / draft /
--     cancelled cycles, each with realistic per-asset item state.
-- ============================================================

BEGIN;

DO $$
DECLARE
  cycle1 INT; cycle2 INT; cycle3 INT; cycle4 INT;
  admin_id   INT := (SELECT id FROM users WHERE email='admin@assetflow.io');
  manager_id INT := (SELECT id FROM users WHERE email='manager@assetflow.io');
  auditor_id INT := (SELECT id FROM users WHERE email='auditor@assetflow.io');
  a RECORD;
  i INT;
BEGIN
  -- Cycle 1: completed, org-wide
  INSERT INTO audit_cycles (name, location_id, status, starts_on, ends_on, created_by, created_at)
  VALUES ('H2 2025 Annual Physical Verification', NULL, 'completed', '2025-10-01', '2025-10-15', admin_id, '2025-09-25')
  RETURNING id INTO cycle1;

  i := 0;
  FOR a IN SELECT id, location_id FROM assets WHERE status <> 'lost' ORDER BY id LIMIT 24 LOOP
    i := i + 1;
    INSERT INTO audit_items (audit_cycle_id, asset_id, expected_location_id, status, remarks, checked_by, checked_at)
    VALUES (cycle1, a.id, a.location_id,
            (ARRAY['found','found','found','found','missing','damaged','misplaced'])[1 + (i % 7)],
            CASE (i % 7) WHEN 4 THEN 'Not located at expected location during walkthrough.'
                         WHEN 5 THEN 'Visible damage noted, logged for maintenance.'
                         WHEN 6 THEN 'Found at a different location than recorded.'
                         ELSE 'Verified present and in good condition.' END,
            auditor_id, timestamp '2025-10-08' + (i || ' hours')::interval);
  END LOOP;

  -- Cycle 2: in progress, HQ campus
  INSERT INTO audit_cycles (name, location_id, status, starts_on, ends_on, created_by, created_at)
  VALUES ('HQ Mumbai Spot Check', (SELECT id FROM locations WHERE code='HQ'), 'in_progress', '2026-06-25', '2026-07-25', manager_id, '2026-06-20')
  RETURNING id INTO cycle2;

  i := 0;
  FOR a IN SELECT id, location_id FROM assets WHERE location_id IN (SELECT id FROM locations WHERE code IN ('HQ','HQ-ENG','HQ-ADM')) ORDER BY id LIMIT 16 LOOP
    i := i + 1;
    INSERT INTO audit_items (audit_cycle_id, asset_id, expected_location_id, status, remarks, checked_by, checked_at)
    VALUES (cycle2, a.id, a.location_id,
            CASE WHEN i <= 9 THEN 'found' ELSE 'pending' END,
            CASE WHEN i <= 9 THEN 'Verified present and in good condition.' ELSE NULL END,
            CASE WHEN i <= 9 THEN auditor_id ELSE NULL END,
            CASE WHEN i <= 9 THEN now() - ((9 - i) || ' days')::interval ELSE NULL END);
  END LOOP;

  -- Cycle 3: draft, Bengaluru
  INSERT INTO audit_cycles (name, location_id, status, starts_on, ends_on, created_by, created_at)
  VALUES ('Bengaluru Office Audit', (SELECT id FROM locations WHERE code='BLR'), 'draft', '2026-08-01', '2026-08-10', auditor_id, now() - interval '2 days')
  RETURNING id INTO cycle3;

  FOR a IN SELECT id, location_id FROM assets WHERE location_id = (SELECT id FROM locations WHERE code='BLR') ORDER BY id LIMIT 10 LOOP
    INSERT INTO audit_items (audit_cycle_id, asset_id, expected_location_id, status)
    VALUES (cycle3, a.id, a.location_id, 'pending');
  END LOOP;

  -- Cycle 4: cancelled, Pune
  INSERT INTO audit_cycles (name, location_id, status, starts_on, ends_on, created_by, created_at)
  VALUES ('Pune Warehouse Compliance Audit', (SELECT id FROM locations WHERE code='PUNE'), 'cancelled', '2025-12-01', '2025-12-05', admin_id, '2025-11-20')
  RETURNING id INTO cycle4;

  FOR a IN SELECT id, location_id FROM assets WHERE location_id = (SELECT id FROM locations WHERE code='PUNE') ORDER BY id LIMIT 5 LOOP
    INSERT INTO audit_items (audit_cycle_id, asset_id, expected_location_id, status)
    VALUES (cycle4, a.id, a.location_id, 'pending');
  END LOOP;
END $$;

COMMIT;

-- ============================================================
-- 12. NOTIFICATIONS — welcome, overdue alerts, approval requests,
--     and general activity noise, mixed read/unread.
-- ============================================================

BEGIN;

INSERT INTO notifications (user_id, title, message, n_type, is_read, created_at)
SELECT id, 'Welcome to AssetFlow', 'Your account is ready. Explore the dashboard to get started.', 'info', true, created_at
FROM users;

INSERT INTO notifications (user_id, title, message, n_type, entity_type, entity_id, is_read, created_at)
SELECT u.id, 'Asset return overdue',
       'Asset ' || a.asset_tag || ' (' || a.name || ') was due back on ' || to_char(al.due_at, 'DD Mon YYYY') || '.',
       'overdue', 'allocation', al.id, (row_number() OVER (ORDER BY al.id)) % 3 <> 0, al.due_at + interval '1 hour'
FROM asset_allocations al
JOIN assets a ON a.id = al.asset_id
JOIN employees e ON e.id = al.employee_id
JOIN users u ON u.id = e.user_id
WHERE al.returned_at IS NULL AND al.due_at < now();

INSERT INTO notifications (user_id, title, message, n_type, entity_type, entity_id, is_read, created_at)
SELECT (SELECT id FROM users WHERE email='manager@assetflow.io'),
       'Transfer request awaiting approval',
       'Transfer request #' || tr.id || ' for asset ' || a.asset_tag || ' needs your decision.',
       'approval', 'transfer', tr.id, false, tr.requested_at + interval '10 minutes'
FROM transfer_requests tr JOIN assets a ON a.id = tr.asset_id
WHERE tr.status = 'pending';

INSERT INTO notifications (user_id, title, message, n_type, entity_type, entity_id, is_read, created_at)
SELECT (SELECT id FROM users WHERE email='manager@assetflow.io'),
       'Maintenance request awaiting approval',
       'Maintenance request #' || mr.id || ' (' || mr.title || ') needs your decision.',
       'approval', 'maintenance', mr.id, false, mr.requested_at + interval '10 minutes'
FROM maintenance_requests mr WHERE mr.status = 'pending';

INSERT INTO notifications (user_id, title, message, n_type, is_read, created_at)
SELECT u.id, msg.title, msg.message, msg.n_type,
       (gs % 4) <> 0,
       now() - ((gs * 2 + (u.id % 5)) || ' days')::interval
FROM generate_series(1, 30) AS gs
JOIN LATERAL (SELECT id FROM users ORDER BY (id + gs) % 11 LIMIT 1) u ON true
JOIN LATERAL (
  SELECT * FROM (VALUES
    ('Asset allocated to you', 'A new asset has been allocated to your account.', 'success'),
    ('Booking confirmed', 'Your resource booking has been confirmed.', 'success'),
    ('Audit cycle starting soon', 'A physical audit cycle covering your location starts soon.', 'info'),
    ('Maintenance completed', 'Maintenance on a reported asset has been completed.', 'success'),
    ('Policy reminder', 'Please review the updated asset-handling policy.', 'info')
  ) AS t(title, message, n_type)
  ORDER BY gs % 5 LIMIT 1
) msg ON true;

COMMIT;

-- ============================================================
-- 13. ACTIVITY LOG — derived from every workflow row created
--     above, so the activity feed and reports reflect a real,
--     internally-consistent history rather than disconnected noise.
-- ============================================================

BEGIN;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT created_by, 'asset.create', 'asset', id, jsonb_build_object('asset_tag', asset_tag, 'name', name), created_at
FROM assets;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT allocated_by, 'allocation.create', 'allocation', id,
       jsonb_build_object('asset_id', asset_id, 'employee_id', employee_id), allocated_at
FROM asset_allocations;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT allocated_by, 'allocation.return', 'allocation', id,
       jsonb_build_object('asset_id', asset_id, 'condition', return_condition), returned_at
FROM asset_allocations WHERE returned_at IS NOT NULL;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT requested_by, 'transfer.request', 'transfer', id,
       jsonb_build_object('asset_id', asset_id, 'to_location_id', to_location_id), requested_at
FROM transfer_requests;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT decided_by, 'transfer.decision', 'transfer', id, jsonb_build_object('status', status), decided_at
FROM transfer_requests WHERE decided_by IS NOT NULL;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT reported_by, 'maintenance.request', 'maintenance', id,
       jsonb_build_object('asset_id', asset_id, 'title', title), requested_at
FROM maintenance_requests;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT decided_by, 'maintenance.decision', 'maintenance', id, jsonb_build_object('status', status), decided_at
FROM maintenance_requests WHERE decided_by IS NOT NULL;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT created_by, 'audit.create', 'audit_cycle', id, jsonb_build_object('name', name), created_at
FROM audit_cycles;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT checked_by, 'audit.check', 'audit_item', id,
       jsonb_build_object('asset_id', asset_id, 'status', status), checked_at
FROM audit_items WHERE checked_by IS NOT NULL;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
SELECT id, 'auth.login', 'user', id, jsonb_build_object('email', email), '10.0.0.' || (id % 250 + 1), now() - ((id * 3) || ' hours')::interval
FROM users;

UPDATE users SET last_login_at = now() - ((id * 3) || ' hours')::interval;

COMMIT;

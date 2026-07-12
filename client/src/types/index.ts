/** Shared API types — mirrors the server's standard JSON envelope and entities. */

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: PageMeta;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

export type AssetStatus = 'available' | 'allocated' | 'in_transfer' | 'under_maintenance' | 'retired' | 'lost';

export interface Asset {
  id: number;
  asset_tag: string;
  name: string;
  status: AssetStatus;
  serial_number: string | null;
  model: string | null;
  vendor: string | null;
  purchase_date: string | null;
  purchase_cost: string | null;
  warranty_expiry: string | null;
  description: string | null;
  category_id: number;
  category_name: string;
  location_id: number;
  location_name: string;
  primary_image_url: string | null;
  created_at: string;
}

export interface AssetDetail extends Asset {
  images: Array<{ id: number; file_url: string; is_primary: boolean }>;
  documents: Array<{ id: number; title: string; doc_type: string; file_url: string; uploaded_by_name: string | null }>;
  history: Array<{ id: number; from_status: string | null; to_status: string; reason: string | null; changed_at: string; changed_by_name: string | null }>;
  active_allocation: { id: number; allocated_at: string; due_at: string | null; employee_name: string; employee_code: string } | null;
}

export interface Allocation {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  allocated_by_name: string;
  allocated_at: string;
  due_at: string | null;
  returned_at: string | null;
  return_condition: string | null;
  notes: string | null;
  is_active: boolean;
  is_overdue: boolean;
}

export interface TransferRequest {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  from_location_name: string;
  to_location_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  reason: string | null;
  decision_note: string | null;
  requested_by: number;
  requested_by_name: string;
  decided_by_name: string | null;
  requested_at: string;
  decided_at: string | null;
  completed_at: string | null;
}

export interface Booking {
  id: number;
  resource_id: number;
  resource_name: string;
  resource_code: string;
  resource_type: string;
  booked_by: number;
  booked_by_name: string;
  purpose: string;
  starts_at: string;
  ends_at: string;
  status: 'confirmed' | 'cancelled' | 'completed';
}

export interface MaintenanceRequest {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  maintenance_type: 'corrective' | 'preventive';
  cost: string | null;
  resolution: string | null;
  scheduled_for: string | null;
  reported_by: number;
  reported_by_name: string;
  decided_by_name: string | null;
  requested_at: string;
  completed_at: string | null;
  assignments: Array<{ id: number; employee_id: number; employee_name: string; assigned_at: string; notes: string | null }> | null;
}

export interface AuditCycle {
  id: number;
  name: string;
  location_id: number | null;
  location_name: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  starts_on: string;
  ends_on: string;
  created_by_name: string;
  created_at: string;
  total_items: number;
  checked_items: number;
}

export interface AuditItem {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  asset_status: string;
  expected_location_name: string;
  status: 'pending' | 'found' | 'missing' | 'damaged' | 'misplaced';
  remarks: string | null;
  checked_at: string | null;
  checked_by_name: string | null;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  n_type: 'info' | 'success' | 'warning' | 'error' | 'approval' | 'overdue';
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface NamedRef {
  id: number;
  name: string;
}

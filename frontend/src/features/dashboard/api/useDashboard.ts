import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface DashboardCounts {
  total_assets: number;
  available_assets: number;
  allocated_assets: number;
  assets_in_maintenance: number;
  portfolio_value: number;
  pending_transfers: number;
  pending_maintenance: number;
  overdue_allocations: number;
  upcoming_bookings: number;
  active_audits: number;
}

export interface DashboardActivity {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  created_at: string;
  user_name: string | null;
}

export interface DashboardData {
  counts: DashboardCounts;
  assets_by_status: Array<{ status: string; count: number }>;
  recent_activity: DashboardActivity[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardData }>('/reports/dashboard');
      return res.data.data;
    },
  });
}

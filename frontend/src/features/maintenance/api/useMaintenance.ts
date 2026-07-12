import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface MaintenanceAssignment {
  id: number;
  employee_id: number;
  employee_name: string;
  assigned_at: string;
  notes: string | null;
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
  cost: number | null;
  resolution: string | null;
  scheduled_for: string | null;
  reported_by: number;
  reported_by_name: string;
  decided_by: number | null;
  decided_by_name: string | null;
  requested_at: string;
  decided_at: string | null;
  completed_at: string | null;
  assignments: MaintenanceAssignment[] | null;
}

export interface MaintenanceStats {
  pendingRequests: number;
  activeRepairs: number;
  resolvedThisMonth: number;
  avgResolutionHours: number;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useMaintenanceList(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['maintenance', params],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<MaintenanceRequest>>('/maintenance', { params });
      return res.data;
    },
  });
}

export function useMaintenanceStats() {
  return useQuery({
    queryKey: ['maintenance', 'stats'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: MaintenanceStats }>('/maintenance/stats');
      return res.data.data;
    },
  });
}

export function useMaintenanceDetails(id: number | null) {
  return useQuery({
    queryKey: ['maintenance', id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: MaintenanceRequest }>(`/maintenance/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      assetId: number;
      title: string;
      description?: string | null;
      priority: 'low' | 'medium' | 'high' | 'critical';
      maintenanceType: 'corrective' | 'preventive';
    }) => {
      const res = await api.post('/maintenance', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useDecideMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
      scheduledFor,
      assignEmployeeId,
    }: {
      id: number;
      decision: 'approved' | 'rejected';
      scheduledFor?: string | null;
      assignEmployeeId?: number | null;
    }) => {
      const res = await api.post(`/maintenance/${id}/decision`, {
        decision,
        scheduledFor: scheduledFor ?? null,
        assignEmployeeId: assignEmployeeId ?? null,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useAssignMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, employeeId, notes }: { id: number; employeeId: number; notes?: string | null }) => {
      const res = await api.post(`/maintenance/${id}/assign`, { employeeId, notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });
}

export function useStartMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/maintenance/${id}/start`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolution, cost }: { id: number; resolution: string; cost?: number | null }) => {
      const res = await api.post(`/maintenance/${id}/complete`, { resolution, cost: cost ?? null });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useCancelMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/maintenance/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

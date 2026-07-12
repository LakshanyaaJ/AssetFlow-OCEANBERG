import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface AuditItem {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  asset_status: string;
  expected_location_id: number;
  expected_location_name: string;
  status: 'pending' | 'found' | 'missing' | 'damaged' | 'misplaced';
  remarks: string | null;
  checked_at: string | null;
  checked_by_name: string | null;
}

export interface AuditCycle {
  id: number;
  name: string;
  location_id: number | null;
  location_name: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  starts_on: string;
  ends_on: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  total_items: number;
  checked_items: number;
  items?: AuditItem[];
}

export interface AuditStats {
  upcomingAudits: number;
  activeAudits: number;
  completedAudits: number;
  missingAssets: number;
  damagedAssets: number;
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

export function useAuditList(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['audits', params],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<AuditCycle>>('/audits', { params });
      return res.data;
    },
  });
}

export function useAuditStats() {
  return useQuery({
    queryKey: ['audits', 'stats'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: AuditStats }>('/audits/stats');
      return res.data.data;
    },
  });
}

export function useAuditDetails(id: number | null) {
  return useQuery({
    queryKey: ['audits', id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: AuditCycle }>(`/audits/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; locationId?: number | null; startsOn: string; endsOn: string }) => {
      const res = await api.post('/audits', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });
}

export function useStartAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/audits/${id}/start`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });
}

export function useCheckAuditItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cycleId,
      itemId,
      status,
      remarks,
    }: {
      cycleId: number;
      itemId: number;
      status: 'found' | 'missing' | 'damaged' | 'misplaced';
      remarks?: string | null;
    }) => {
      const res = await api.post(`/audits/${cycleId}/items/${itemId}/check`, { status, remarks: remarks ?? null });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audits', variables.cycleId] });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });
}

export function useCompleteAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/audits/${id}/complete`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useCancelAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/audits/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

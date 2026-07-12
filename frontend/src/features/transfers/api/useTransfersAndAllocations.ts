import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface Allocation {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  allocated_by: number;
  allocated_by_name: string;
  allocated_at: string;
  due_at: string | null;
  returned_at: string | null;
  return_condition: 'good' | 'damaged' | 'needs_repair' | null;
  notes: string | null;
  is_active: boolean;
  is_overdue: boolean;
}

export interface Transfer {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  from_location_id: number;
  from_location_name: string;
  to_location_id: number;
  to_location_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  reason: string;
  decision_note: string | null;
  requested_by: number;
  requested_by_name: string;
  decided_by: number | null;
  decided_by_name: string | null;
  requested_at: string;
  decided_at: string | null;
  completed_at: string | null;
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

export function useAllocations(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['allocations', params],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<Allocation>>('/allocations', { params });
      return res.data;
    },
  });
}

export function useTransfers(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['transfers', params],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<Transfer>>('/transfers', { params });
      return res.data;
    },
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { assetId: number; employeeId: number; dueAt?: string | null; notes?: string | null }) => {
      const res = await api.post('/allocations', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useReturnAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, condition, notes }: { id: number; condition: 'good' | 'damaged' | 'needs_repair'; notes?: string | null }) => {
      const res = await api.post(`/allocations/${id}/return`, { condition, notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { assetId: number; toLocationId: number; reason: string }) => {
      const res = await api.post('/transfers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useDecideTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision, note }: { id: number; decision: 'approved' | 'rejected'; note?: string | null }) => {
      const res = await api.post(`/transfers/${id}/decision`, { decision, note });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useCompleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/transfers/${id}/complete`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/transfers/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

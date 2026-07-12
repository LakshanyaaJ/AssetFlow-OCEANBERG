import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { AssetDetail, Allocation, MaintenanceRequest } from '../../../types';

export interface AssetAuditHistoryItem {
  id: number;
  audit_cycle_id: number;
  cycle_name: string;
  status: 'pending' | 'found' | 'missing' | 'damaged' | 'misplaced';
  remarks: string | null;
  checked_at: string | null;
  checked_by_name: string | null;
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      const res = await api.get<{ data: AssetDetail }>(`/assets/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useAssetAllocationHistory(assetId: string) {
  return useQuery({
    queryKey: ['asset', assetId, 'allocations'],
    queryFn: async () => {
      const res = await api.get<{ data: Allocation[] }>('/allocations', { params: { assetId, limit: 50 } });
      return res.data.data;
    },
    enabled: !!assetId,
  });
}

export function useAssetMaintenanceHistory(assetId: string) {
  return useQuery({
    queryKey: ['asset', assetId, 'maintenance'],
    queryFn: async () => {
      const res = await api.get<{ data: MaintenanceRequest[] }>('/maintenance', { params: { assetId, limit: 50 } });
      return res.data.data;
    },
    enabled: !!assetId,
  });
}

export function useAssetAuditHistory(assetId: string) {
  return useQuery({
    queryKey: ['asset', assetId, 'audits'],
    queryFn: async () => {
      const res = await api.get<{ data: AssetAuditHistoryItem[] }>(`/audits/asset/${assetId}/history`);
      return res.data.data;
    },
    enabled: !!assetId,
  });
}

export function useChangeAssetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, status, reason }: { assetId: number; status: 'retired' | 'lost' | 'available'; reason: string }) =>
      api.post(`/assets/${assetId}/status`, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });
}

export function useAddAssetDocument(assetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; doc_type: string; file_url: string }) =>
      api.post(`/assets/${assetId}/documents`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asset', assetId] }),
  });
}

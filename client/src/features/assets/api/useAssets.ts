import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface Asset {
  id: number;
  asset_tag: string;
  name: string;
  category_id: number;
  location_id: number;
  status: 'available' | 'allocated' | 'in_transfer' | 'under_maintenance' | 'retired' | 'lost';
  serial_number: string | null;
  model: string | null;
  vendor: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  warranty_expiry: string | null;
  description: string | null;
  category_name?: string;
  location_name?: string;
}

interface AssetsResponse {
  data: Asset[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useAssets(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: async () => {
      const res = await api.get<AssetsResponse>('/assets', { params });
      return res.data;
    },
  });
}

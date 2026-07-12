import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface Resource {
  id: number;
  name: string;
  code: string;
  resource_type: 'meeting_room' | 'vehicle' | 'equipment' | 'workspace';
  location_id: number;
  location_name?: string;
  capacity: number | null;
  description: string | null;
  is_active: boolean;
  upcoming_bookings?: number;
  created_at: string;
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
  created_at: string;
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

export function useResources(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['resources', params],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<Resource>>('/resources', { params });
      return res.data;
    },
  });
}

export function useBookings(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<Booking>>('/bookings', { params });
      return res.data;
    },
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Resource, 'id' | 'is_active' | 'created_at'>) => {
      const res = await api.post('/resources', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Resource> & { id: number }) => {
      const res = await api.patch(`/resources/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { resourceId: number; purpose: string; startsAt: string; endsAt: string }) => {
      const res = await api.post('/bookings', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/bookings/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

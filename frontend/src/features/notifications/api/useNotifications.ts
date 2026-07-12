import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Notification } from '../../../types';

export function useNotifications(params?: { unread?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['notifications', 'list', params],
    queryFn: async () => {
      const res = await api.get<{ data: Notification[] }>('/notifications', {
        params: { limit: params?.limit ?? 50, ...(params?.unread ? { unread: 'true' } : {}) },
      });
      return res.data.data;
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

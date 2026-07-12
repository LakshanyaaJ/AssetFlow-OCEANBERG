import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface Department {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  head_name: string | null;
  employees_count: number;
  assets_count: number;
  status: 'Active' | 'Inactive';
}

export interface Location {
  id: string;
  name: string;
  code: string;
  building: string;
  floor: string | null;
  parent_id: string | null;
  capacity: number;
  status: 'Active' | 'Under Maintenance' | 'Closed';
}

export interface AssetCategory {
  id: number;
  name: string;
  code: string;
  parent_id: number | null;
  parent_name: string | null;
  depreciation_rate: number | null;
  description: string | null;
  is_active: boolean;
  asset_count: number;
}

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  photo_url: string | null;
  email: string;
  department_name: string;
  role: 'Admin' | 'Asset Manager' | 'Department Head' | 'Employee';
  status: 'Active' | 'Inactive' | 'Suspended';
}

// API Response envelopes
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

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<any>>('/departments?limit=100');
      return res.data.data.map((dept) => ({
        id: String(dept.id),
        name: dept.name,
        code: dept.code,
        parent_id: null,
        head_name: null,
        employees_count: dept.employee_count ?? 0,
        assets_count: 0,
        status: dept.is_active ? 'Active' : 'Inactive',
      })) as Department[];
    }
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<any>>('/locations?limit=100');
      return res.data.data.map((loc) => ({
        id: String(loc.id),
        name: loc.name,
        code: loc.code,
        building: loc.address || 'Main Building',
        floor: null,
        parent_id: loc.parent_id ? String(loc.parent_id) : null,
        capacity: 100,
        status: loc.is_active ? 'Active' : 'Closed',
      })) as Location[];
    }
  });
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<any>>('/employees?limit=100');
      return res.data.data.map((emp) => {
        let mappedRole: 'Admin' | 'Asset Manager' | 'Department Head' | 'Employee' = 'Employee';
        if (emp.role_name === 'admin') mappedRole = 'Admin';
        else if (emp.role_name === 'manager') mappedRole = 'Asset Manager';
        
        return {
          id: String(emp.id),
          employee_id: emp.employee_code,
          name: emp.full_name,
          photo_url: null,
          email: emp.email || `${emp.employee_code.toLowerCase()}@assetflow.io`,
          department_name: emp.department_name || 'General',
          role: mappedRole,
          status: emp.is_active ? 'Active' : 'Inactive',
        };
      }) as Employee[];
    }
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['asset-categories'],
    queryFn: async () => {
      const res = await api.get<ApiListResponse<AssetCategory>>('/asset-categories?limit=100');
      return res.data.data;
    },
  });
}

export interface CategoryInput {
  name: string;
  code: string;
  parent_id?: number | null;
  depreciation_rate?: number | null;
  description?: string | null;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoryInput) => api.post('/asset-categories', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asset-categories'] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: CategoryInput & { id: number; is_active?: boolean }) =>
      api.patch(`/asset-categories/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asset-categories'] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/asset-categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asset-categories'] }),
  });
}

export interface DepartmentInput {
  name: string;
  code: string;
  description?: string | null;
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DepartmentInput) => api.post('/departments', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: DepartmentInput & { id: number; is_active?: boolean }) =>
      api.patch(`/departments/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export interface LocationInput {
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  parent_id?: number | null;
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LocationInput) => api.post('/locations', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: LocationInput & { id: number; is_active?: boolean }) =>
      api.patch(`/locations/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  });
}

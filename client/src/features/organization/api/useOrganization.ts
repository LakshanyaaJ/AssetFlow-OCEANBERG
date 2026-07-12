import { useQuery } from '@tanstack/react-query';

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

// Mock Data
const MOCK_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Global Operations', code: 'GLB-OP', parent_id: null, head_name: 'Alice Admin', employees_count: 500, assets_count: 1200, status: 'Active' },
  { id: '2', name: 'North America', code: 'NA-OP', parent_id: '1', head_name: 'John Smith', employees_count: 200, assets_count: 500, status: 'Active' },
  { id: '3', name: 'Human Resources', code: 'HR', parent_id: '2', head_name: 'Bob Manager', employees_count: 15, assets_count: 45, status: 'Active' },
  { id: '4', name: 'IT Support', code: 'IT-01', parent_id: '2', head_name: 'Charlie Tech', employees_count: 40, assets_count: 300, status: 'Active' },
  { id: '5', name: 'EMEA', code: 'EMEA-OP', parent_id: '1', head_name: 'Sarah Connor', employees_count: 300, assets_count: 700, status: 'Active' },
  { id: '6', name: 'Finance', code: 'FIN', parent_id: '5', head_name: null, employees_count: 20, assets_count: 60, status: 'Inactive' },
];

const MOCK_LOCATIONS: Location[] = [
  { id: '1', name: 'New York Headquarters', code: 'HQ-NY', building: 'Empire Tower', floor: null, parent_id: null, capacity: 1000, status: 'Active' },
  { id: '2', name: 'Floor 40 - Engineering', code: 'HQ-NY-F40', building: 'Empire Tower', floor: '40', parent_id: '1', capacity: 200, status: 'Active' },
  { id: '3', name: 'Server Room Alpha', code: 'HQ-NY-SRA', building: 'Empire Tower', floor: '40', parent_id: '2', capacity: 10, status: 'Active' },
  { id: '4', name: 'London Office', code: 'LDN-01', building: 'The Shard', floor: null, parent_id: null, capacity: 500, status: 'Active' },
  { id: '5', name: 'Floor 15 - Marketing', code: 'LDN-01-F15', building: 'The Shard', floor: '15', parent_id: '4', capacity: 100, status: 'Under Maintenance' },
];

const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', employee_id: 'EMP-001', name: 'Alice Admin', photo_url: null, email: 'alice@assetflow.com', department_name: 'Global Operations', role: 'Admin', status: 'Active' },
  { id: '2', employee_id: 'EMP-002', name: 'Bob Manager', photo_url: null, email: 'bob@assetflow.com', department_name: 'Human Resources', role: 'Department Head', status: 'Active' },
  { id: '3', employee_id: 'EMP-003', name: 'Charlie Tech', photo_url: null, email: 'charlie@assetflow.com', department_name: 'IT Support', role: 'Asset Manager', status: 'Active' },
  { id: '4', employee_id: 'EMP-004', name: 'David Smith', photo_url: null, email: 'david@assetflow.com', department_name: 'IT Support', role: 'Employee', status: 'Active' },
  { id: '5', employee_id: 'EMP-005', name: 'Eve Johnson', photo_url: null, email: 'eve@assetflow.com', department_name: 'Finance', role: 'Employee', status: 'Suspended' },
  { id: '6', employee_id: 'EMP-006', name: 'Frank Ocean', photo_url: null, email: 'frank@assetflow.com', department_name: 'North America', role: 'Employee', status: 'Active' },
  { id: '7', employee_id: 'EMP-007', name: 'Grace Hopper', photo_url: null, email: 'grace@assetflow.com', department_name: 'IT Support', role: 'Employee', status: 'Active' },
];

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      return MOCK_DEPARTMENTS;
    }
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return MOCK_LOCATIONS;
    }
  });
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return MOCK_EMPLOYEES;
    }
  });
}

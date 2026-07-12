import { useQuery } from '@tanstack/react-query';

export interface DepartmentDetails {
  id: string;
  name: string;
  code: string;
  head_name: string | null;
  status: 'Active' | 'Inactive';
  description: string;
  parent_name: string | null;
  
  // KPI Stats
  total_employees: number;
  total_assets: number;
  active_bookings: number;
  pending_maintenance: number;
  asset_utilization_pct: number;

  // Tabs Data
  employees: {
    id: string;
    name: string;
    role: string;
    email: string;
    status: string;
  }[];
  
  assets: {
    id: string;
    asset_tag: string;
    name: string;
    category: string;
    status: string;
    assigned_to: string | null;
  }[];

  bookings: {
    id: string;
    asset_name: string;
    booked_by: string;
    date: string;
    time: string;
    status: string;
  }[];

  maintenance: {
    id: string;
    asset_name: string;
    issue: string;
    priority: string;
    status: string;
    date: string;
  }[];
}

const MOCK_DEPARTMENT_DETAILS: DepartmentDetails = {
  id: '1',
  name: 'Global Operations',
  code: 'GLB-OP',
  head_name: 'Alice Admin',
  status: 'Active',
  description: 'Oversees all primary operations, asset deployments, and infrastructure management across global regions.',
  parent_name: null,
  
  total_employees: 125,
  total_assets: 340,
  active_bookings: 12,
  pending_maintenance: 5,
  asset_utilization_pct: 82,

  employees: [
    { id: '1', name: 'Alice Admin', role: 'Department Head', email: 'alice@assetflow.com', status: 'Active' },
    { id: '2', name: 'Tom Worker', role: 'Employee', email: 'tom@assetflow.com', status: 'Active' },
    { id: '3', name: 'Jerry Staff', role: 'Asset Manager', email: 'jerry@assetflow.com', status: 'Active' },
    { id: '4', name: 'Spike Security', role: 'Employee', email: 'spike@assetflow.com', status: 'Suspended' },
  ],

  assets: [
    { id: '1', asset_tag: 'AF-000101', name: 'Dell XPS 15', category: 'Laptops', status: 'Allocated', assigned_to: 'Tom Worker' },
    { id: '2', asset_tag: 'AF-000102', name: 'Conference Display 65"', category: 'AV Equipment', status: 'Available', assigned_to: null },
    { id: '3', asset_tag: 'AF-000103', name: 'Logistics Van A1', category: 'Vehicles', status: 'Under Maintenance', assigned_to: null },
  ],

  bookings: [
    { id: '1', asset_name: 'Conference Display 65"', booked_by: 'Alice Admin', date: '2024-07-15', time: '10:00 - 11:30', status: 'Upcoming' },
    { id: '2', asset_name: 'Projector 4K', booked_by: 'Tom Worker', date: '2024-07-14', time: '14:00 - 15:00', status: 'Ongoing' },
    { id: '3', asset_name: 'Meeting Room C', booked_by: 'Jerry Staff', date: '2024-07-10', time: '09:00 - 10:00', status: 'Completed' },
  ],

  maintenance: [
    { id: '1', asset_name: 'Logistics Van A1', issue: 'Engine light ON', priority: 'High', status: 'In Progress', date: '2024-07-10' },
    { id: '2', asset_name: 'Office Printer', issue: 'Paper jam', priority: 'Low', status: 'Pending', date: '2024-07-12' },
  ]
};

export function useDepartment(id: string) {
  return useQuery({
    queryKey: ['department', id],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      return { ...MOCK_DEPARTMENT_DETAILS, id }; // Return mock data with requested ID
    },
    enabled: !!id,
  });
}

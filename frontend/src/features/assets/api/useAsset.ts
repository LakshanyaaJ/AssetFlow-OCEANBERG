import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Asset } from './useAssets';

export interface AssetDetails extends Asset {
  allocations: {
    id: number;
    employee_name: string;
    department_name: string;
    allocation_date: string;
    expected_return_date: string;
    actual_return_date: string | null;
    condition: string;
    status: 'Active' | 'Returned' | 'Overdue';
  }[];
  maintenance: {
    id: number;
    issue: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    technician: string;
    approval_status: string;
    resolution: string | null;
    status: 'Pending' | 'In Progress' | 'Resolved';
    date: string;
  }[];
  audits: {
    id: number;
    cycle_name: string;
    auditor_name: string;
    verification_status: 'Verified' | 'Missing' | 'Damaged';
    remarks: string | null;
    date: string;
  }[];
  documents: {
    id: number;
    name: string;
    type: 'pdf' | 'image' | 'doc';
    url: string;
    upload_date: string;
  }[];
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      // First fetch the asset from the real API
      const res = await api.get<{ data: Asset }>(`/assets/${id}`);
      const asset = res.data.data;

      // Mock the history data for the UI since the backend might not return it yet
      const detailedAsset: AssetDetails = {
        ...asset,
        allocations: [
          {
            id: 1,
            employee_name: 'Alice Admin',
            department_name: 'IT Support',
            allocation_date: '2024-01-10',
            expected_return_date: '2024-12-31',
            actual_return_date: null,
            condition: 'New',
            status: 'Active',
          },
          {
            id: 2,
            employee_name: 'Bob Manager',
            department_name: 'Human Resources',
            allocation_date: '2023-05-01',
            expected_return_date: '2023-12-31',
            actual_return_date: '2023-12-20',
            condition: 'Good',
            status: 'Returned',
          }
        ],
        maintenance: [
          {
            id: 1,
            issue: 'Screen flickering',
            priority: 'Medium',
            technician: 'Charlie Tech',
            approval_status: 'Approved',
            resolution: 'Replaced display cable',
            status: 'Resolved',
            date: '2024-03-15',
          },
          {
            id: 2,
            issue: 'Battery replacement',
            priority: 'Low',
            technician: 'Charlie Tech',
            approval_status: 'Approved',
            resolution: null,
            status: 'In Progress',
            date: '2024-06-20',
          }
        ],
        audits: [
          {
            id: 1,
            cycle_name: 'Q1 2024 Inventory Audit',
            auditor_name: 'Eve Auditor',
            verification_status: 'Verified',
            remarks: 'Asset found in expected location',
            date: '2024-03-31',
          }
        ],
        documents: [
          {
            id: 1,
            name: 'Warranty Certificate.pdf',
            type: 'pdf',
            url: '#',
            upload_date: '2023-01-15',
          },
          {
            id: 2,
            name: 'Purchase Invoice.pdf',
            type: 'pdf',
            url: '#',
            upload_date: '2023-01-15',
          },
          {
            id: 3,
            name: 'Device Photo.jpg',
            type: 'image',
            url: '#',
            upload_date: '2023-01-15',
          }
        ]
      };

      return detailedAsset;
    },
    enabled: !!id,
  });
}

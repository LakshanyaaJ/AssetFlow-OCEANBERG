import { useQuery } from '@tanstack/react-query';

export interface LocationDetails {
  id: string;
  name: string;
  code: string;
  building: string;
  floor: string | null;
  parent_name: string | null;
  status: 'Active' | 'Under Maintenance' | 'Closed';
  description: string;
  
  // KPI Stats
  capacity: number;
  occupancy_pct: number;
  total_assets: number;
  open_maintenance: number;

  // Tabs Data
  assets: {
    id: string;
    asset_tag: string;
    name: string;
    category: string;
    status: string;
    department: string;
  }[];

  bookings: {
    id: string;
    booked_by: string;
    department: string;
    date: string;
    time: string;
    status: string;
    purpose: string;
  }[];

  maintenance: {
    id: string;
    issue: string;
    reported_by: string;
    priority: string;
    status: string;
    date: string;
  }[];
}

const MOCK_LOCATION_DETAILS: LocationDetails = {
  id: '2',
  name: 'Floor 40 - Engineering',
  code: 'HQ-NY-F40',
  building: 'Empire Tower',
  floor: '40',
  parent_name: 'New York Headquarters',
  status: 'Active',
  description: 'Primary engineering and product development floor. Features open-plan seating, 5 meeting rooms, and a large break area.',
  
  capacity: 200,
  occupancy_pct: 85,
  total_assets: 450,
  open_maintenance: 3,

  assets: [
    { id: '1', asset_tag: 'AF-001200', name: 'Server Rack A', category: 'Infrastructure', status: 'Active', department: 'IT Support' },
    { id: '2', asset_tag: 'AF-001201', name: 'Meeting Display 85"', category: 'AV Equipment', status: 'Available', department: 'Global Operations' },
    { id: '3', asset_tag: 'AF-001202', name: 'Standing Desk Unit 12', category: 'Furniture', status: 'Allocated', department: 'Engineering' },
    { id: '4', asset_tag: 'AF-001203', name: 'Industrial HVAC Unit North', category: 'Facilities', status: 'Under Maintenance', department: 'Facilities' },
  ],

  bookings: [
    { id: '1', booked_by: 'Alice Admin', department: 'Global Operations', date: '2024-07-20', time: '10:00 - 12:00', status: 'Upcoming', purpose: 'Q3 All-Hands Setup' },
    { id: '2', booked_by: 'Tom Worker', department: 'Engineering', date: '2024-07-15', time: '14:00 - 15:00', status: 'Completed', purpose: 'Sprint Planning (Meeting Room A)' },
  ],

  maintenance: [
    { id: '1', issue: 'HVAC Unit North rattling noise', reported_by: 'Tom Worker', priority: 'High', status: 'In Progress', date: '2024-07-14' },
    { id: '2', issue: 'Flickering lights near Desk Unit 12', reported_by: 'Alice Admin', priority: 'Low', status: 'Pending', date: '2024-07-15' },
    { id: '3', issue: 'Network drop in Meeting Room A', reported_by: 'Jerry Staff', priority: 'Critical', status: 'Pending', date: '2024-07-16' },
  ]
};

export function useLocation(id: string) {
  return useQuery({
    queryKey: ['location', id],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      return { ...MOCK_LOCATION_DETAILS, id }; 
    },
    enabled: !!id,
  });
}

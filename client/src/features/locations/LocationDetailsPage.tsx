import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocation } from './api/useLocation';
import { 
  ChevronRight, MapPin, Box, CalendarCheck, Wrench, BarChart2, 
  Users, AlertTriangle, CheckCircle, PieChart, Activity, Maximize
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// Utility components
const StatusBadge = ({ status }: { status: string }) => {
  const bg = status === 'Active' || status === 'Resolved' || status === 'Completed' || status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 
             status === 'Closed' || status === 'Lost' || status === 'Critical' ? 'bg-red-100 text-red-800' :
             status === 'In Progress' || status === 'Allocated' || status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
             status === 'Pending' || status === 'Upcoming' || status === 'Under Maintenance' ? 'bg-amber-100 text-amber-800' :
             'bg-gray-100 text-gray-800';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-black/5 ${bg}`}>{status}</span>;
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const bg = priority === 'High' || priority === 'Critical' ? 'bg-red-100 text-red-800' : 
             priority === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-black/5 ${bg}`}>{priority}</span>;
};

const KPICard = ({ title, value, icon: Icon, suffix = '' }: { title: string, value: string | number, icon: React.ElementType, suffix?: string }) => (
  <Card className="p-5 flex items-center justify-between bg-white border-gray-200 shadow-sm">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        {suffix && <span className="text-sm font-medium text-gray-500">{suffix}</span>}
      </div>
    </div>
    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
      <Icon className="h-6 w-6 text-indigo-600" />
    </div>
  </Card>
);

export function LocationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: loc, isLoading } = useLocation(id!);
  const [activeTab, setActiveTab] = useState('Location Details');

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!loc) {
    return <div className="p-8 text-center text-gray-500">Location not found.</div>;
  }

  const tabs = ['Location Details', 'Assets', 'Capacity', 'Occupancy', 'Bookings', 'Maintenance', 'Analytics'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/org" className="hover:text-gray-900">Organization</Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1" />
                <Link to="/org" className="hover:text-gray-900">Locations</Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1" />
                <span className="text-gray-900 font-medium">{loc.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <MapPin className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{loc.name}</h1>
                <StatusBadge status={loc.status} />
              </div>
              <p className="text-sm text-gray-500 font-medium">Code: {loc.code} • Building: {loc.building}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white">Edit Location</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Log Maintenance</Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Capacity" value={loc.capacity} icon={Maximize} suffix="people" />
        <KPICard title="Current Occupancy" value={loc.occupancy_pct} icon={Users} suffix="%" />
        <KPICard title="Assigned Assets" value={loc.total_assets} icon={Box} />
        <KPICard title="Open Maintenance" value={loc.open_maintenance} icon={Wrench} />
      </div>

      {/* Tabs Layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px px-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* TAB 1: Location Details */}
          {activeTab === 'Location Details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Location Profile</h3>
                  <p className="text-sm text-gray-600">{loc.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Hierarchy</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Parent Location:</p>
                    <p className="text-sm font-medium text-gray-900">{loc.parent_name || 'Top-Level Location'}</p>
                    {loc.floor && (
                      <>
                        <p className="text-sm text-gray-600 mt-3 mb-1">Floor:</p>
                        <p className="text-sm font-medium text-gray-900">Floor {loc.floor}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Assets */}
          {activeTab === 'Assets' && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department Owner</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loc.assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:underline cursor-pointer">{asset.asset_tag}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={asset.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3 & 4: Capacity & Occupancy (Combined visually for layout efficiency, but distinct tabs) */}
          {(activeTab === 'Capacity' || activeTab === 'Occupancy') && (
            <div className="space-y-8">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-w-2xl">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Space Utilization</h3>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Current Occupancy Load</span>
                  <span className={`font-bold ${loc.occupancy_pct > 90 ? 'text-red-600' : 'text-gray-900'}`}>{loc.occupancy_pct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                  <div 
                    className={`h-4 rounded-full ${loc.occupancy_pct > 90 ? 'bg-red-500' : loc.occupancy_pct > 75 ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                    style={{ width: `${loc.occupancy_pct}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-4">
                  <span>0 (Empty)</span>
                  <span>{loc.capacity} (Max Capacity)</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <Card className="p-4 border border-gray-200 shadow-sm flex items-center justify-between bg-white">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Allocated Desks</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">170</p>
                  </div>
                  <PieChart className="w-8 h-8 text-indigo-400 opacity-50" />
                </Card>
                <Card className="p-4 border border-gray-200 shadow-sm flex items-center justify-between bg-white">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Available Desks</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">30</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-400 opacity-50" />
                </Card>
              </div>
            </div>
          )}

          {/* TAB 5: Bookings */}
          {activeTab === 'Bookings' && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked By</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loc.bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.date}</div>
                        <div className="text-sm text-gray-500">{booking.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.purpose}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.booked_by}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={booking.status} /></td>
                    </tr>
                  ))}
                  {loc.bookings.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No recent bookings.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: Maintenance */}
          {activeTab === 'Maintenance' && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Raised</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loc.maintenance.map((maint) => (
                    <tr key={maint.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{maint.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">{maint.issue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maint.reported_by}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><PriorityBadge priority={maint.priority} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={maint.status} /></td>
                    </tr>
                  ))}
                  {loc.maintenance.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No open maintenance issues.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 7: Analytics */}
          {activeTab === 'Analytics' && (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
              <Activity className="w-12 h-12 text-indigo-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Advanced Location Analytics</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md text-center">
                Visual heatmaps, peak occupancy timelines, and utility cost analysis will appear here once connected to an active sensor network or BI tool.
              </p>
              <Button variant="outline" className="mt-6 bg-white">Configure IoT Sensors</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

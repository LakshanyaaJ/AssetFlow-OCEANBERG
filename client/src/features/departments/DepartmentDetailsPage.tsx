import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDepartment } from './api/useDepartment';
import { 
  ChevronRight, Users, Box, CalendarCheck, Wrench, BarChart2, 
  Building2, UserCheck, AlertTriangle, CheckCircle, FileText, Download
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// Utility components
const StatusBadge = ({ status }: { status: string }) => {
  const bg = status === 'Active' || status === 'Resolved' || status === 'Completed' || status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 
             status === 'Suspended' || status === 'Lost' || status === 'Overdue' ? 'bg-red-100 text-red-800' :
             status === 'In Progress' || status === 'Allocated' || status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
             status === 'Pending' || status === 'Upcoming' || status === 'Under Maintenance' ? 'bg-amber-100 text-amber-800' :
             'bg-gray-100 text-gray-800';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-black/5 ${bg}`}>{status}</span>;
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const bg = priority === 'High' || priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-black/5 ${bg}`}>{priority}</span>;
};

const KPICard = ({ title, value, icon: Icon, trend }: { title: string, value: number, icon: React.ElementType, trend?: string }) => (
  <Card className="p-5 flex items-center justify-between bg-white border-gray-200 shadow-sm">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        {trend && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{trend}</span>}
      </div>
    </div>
    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
      <Icon className="h-6 w-6 text-indigo-600" />
    </div>
  </Card>
);

export function DepartmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: dept, isLoading } = useDepartment(id!);
  const [activeTab, setActiveTab] = useState('Overview');

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!dept) {
    return <div className="p-8 text-center text-gray-500">Department not found.</div>;
  }

  const tabs = ['Overview', 'Employees', 'Assets', 'Bookings', 'Maintenance', 'Reports'];

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
                <span className="text-gray-900 font-medium">{dept.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <Building2 className="w-7 h-7 text-gray-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{dept.name}</h1>
                <StatusBadge status={dept.status} />
              </div>
              <p className="text-sm text-gray-500 font-medium">Code: {dept.code} • {dept.parent_name ? `Parent: ${dept.parent_name}` : 'Top-Level Department'}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white">Edit Profile</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Generate Report</Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Employees" value={dept.total_employees} icon={Users} trend="+12% YTD" />
        <KPICard title="Assigned Assets" value={dept.total_assets} icon={Box} trend="+5% YTD" />
        <KPICard title="Active Bookings" value={dept.active_bookings} icon={CalendarCheck} />
        <KPICard title="Pending Maintenance" value={dept.pending_maintenance} icon={Wrench} />
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
          {/* TAB 1: Overview */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Department Profile</h3>
                  <p className="text-sm text-gray-600">{dept.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Leadership</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-indigo-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dept.head_name || 'No Head Assigned'}</p>
                      <p className="text-xs text-gray-500">Department Head</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Asset Utilization</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Currently utilized assets</span>
                      <span className="text-gray-900">{dept.asset_utilization_pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${dept.asset_utilization_pct}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Target utilization is above 75%.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Employees */}
          {activeTab === 'Employees' && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dept.employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                        <div className="text-sm text-gray-500">{emp.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={emp.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Assets */}
          {activeTab === 'Assets' && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dept.assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:underline cursor-pointer">{asset.asset_tag}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.assigned_to || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={asset.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: Bookings */}
          {activeTab === 'Bookings' && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked By</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dept.bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.date}</div>
                        <div className="text-sm text-gray-500">{booking.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.asset_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.booked_by}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={booking.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: Maintenance */}
          {activeTab === 'Maintenance' && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Raised</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dept.maintenance.map((maint) => (
                    <tr key={maint.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{maint.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 hover:underline cursor-pointer">{maint.asset_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maint.issue}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><PriorityBadge priority={maint.priority} /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={maint.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: Reports */}
          {activeTab === 'Reports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 border border-gray-200 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 rounded-lg text-red-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Q3 Monthly Audit Report.pdf</h4>
                    <p className="text-xs text-gray-500">Generated on Jul 01, 2024</p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-gray-400" />
              </Card>
              <Card className="p-6 border border-gray-200 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 rounded-lg text-red-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Yearly Asset Depreciation.pdf</h4>
                    <p className="text-xs text-gray-500">Generated on Jan 15, 2024</p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-gray-400" />
              </Card>
              
              {/* Analytics placeholder */}
              <div className="col-span-1 md:col-span-2 mt-4 p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-center">
                <BarChart2 className="w-10 h-10 text-gray-400 mb-3" />
                <h3 className="text-sm font-medium text-gray-900">Advanced Analytics Dashboard</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">Connect with Odoo BI or PowerBI to render interactive department analytics here.</p>
                <Button variant="outline" className="mt-4 bg-white text-xs">Configure BI Integration</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

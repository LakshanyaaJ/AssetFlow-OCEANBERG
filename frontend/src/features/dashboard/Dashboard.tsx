import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Box, Users, CalendarCheck, ArrowRightLeft, AlertTriangle, Plus } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();

  const overviewStats = [
    { label: 'Available', value: '128', icon: Box, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'Allocated', value: '35', icon: Users, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { label: 'Available', value: '0', icon: Box, color: 'text-slate-600 bg-slate-50 border-slate-200' },
    { label: 'Active Bookings', value: '4', icon: CalendarCheck, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { label: 'Pending Transfers', value: '3', icon: ArrowRightLeft, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { label: 'Upcoming returns', value: '12', icon: ArrowRightLeft, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Today's Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Real-time status of enterprise assets, allocations, and daily operations.</p>
      </div>

      {/* 6 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {overviewStats.map((stat, idx) => (
          <Card key={idx} className={`p-5 border shadow-xs ${stat.color} transition-all hover:shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide uppercase">{stat.label}</span>
              <stat.icon className="w-5 h-5 opacity-80" />
            </div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight">{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Red Alert Banner */}
      <div className="bg-red-100 border-2 border-red-400 text-red-900 px-4 py-3.5 rounded-lg font-semibold text-sm flex items-center shadow-xs">
        <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 text-red-600 animate-pulse" />
        <span>3 assets overdue for return - flagged for follow-up</span>
      </div>

      {/* Horizontal Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          onClick={() => navigate('/assets')}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-lg flex items-center shadow-xs"
        >
          <Plus className="w-4 h-4 mr-2" />
          + register asset
        </Button>
        <Button
          onClick={() => navigate('/bookings')}
          variant="outline"
          className="border-2 border-slate-800 text-slate-800 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-lg shadow-xs"
        >
          Book resource
        </Button>
        <Button
          onClick={() => navigate('/transfers')}
          variant="outline"
          className="border-2 border-slate-800 text-slate-800 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-lg shadow-xs"
        >
          View requests
        </Button>
      </div>

      {/* Recent Activity Section */}
      <div className="pt-2">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 mb-3">Recent Activity</h2>
        <Card className="p-5 border border-slate-200 shadow-sm bg-white">
          <CardContent className="p-0">
            <ul className="space-y-3.5 text-sm font-medium text-slate-800 divide-y divide-slate-100">
              <li className="pt-3 first:pt-0 flex items-center justify-between">
                <span>Laptop AF-0114 - allocated to Priya shah - IT dept</span>
                <span className="text-xs font-mono text-slate-400">10m ago</span>
              </li>
              <li className="pt-3 flex items-center justify-between">
                <span>Room B12 - booking confirmed - 2:00 to 3:00 PM</span>
                <span className="text-xs font-mono text-slate-400">1h ago</span>
              </li>
              <li className="pt-3 flex items-center justify-between">
                <span>Projector AF-0052 - maintenance resolved</span>
                <span className="text-xs font-mono text-slate-400">3h ago</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

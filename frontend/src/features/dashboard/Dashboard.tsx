import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Box, Users, Wrench, CalendarCheck, ArrowRightLeft, RotateCcw, AlertTriangle, Plus } from 'lucide-react';
import { useDashboard } from './api/useDashboard';
import { formatRelativeTime, humanizeAction } from '../../lib/format';

export function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDashboard();

  const counts = data?.counts;
  const overviewStats = [
    { label: 'Available', value: counts?.available_assets, icon: Box, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'Allocated', value: counts?.allocated_assets, icon: Users, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { label: 'Under Maintenance', value: counts?.assets_in_maintenance, icon: Wrench, color: 'text-slate-600 bg-slate-50 border-slate-200' },
    { label: 'Upcoming Bookings', value: counts?.upcoming_bookings, icon: CalendarCheck, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { label: 'Pending Transfers', value: counts?.pending_transfers, icon: ArrowRightLeft, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { label: 'Overdue Returns', value: counts?.overdue_allocations, icon: RotateCcw, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Today's Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Real-time status of enterprise assets, allocations, and daily operations.</p>
      </div>

      {isError && (
        <div className="p-4 bg-red-50 text-red-700 font-medium rounded-lg border border-red-200">
          Couldn't load dashboard data. Please refresh the page.
        </div>
      )}

      {/* 6 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {overviewStats.map((stat, idx) => (
          <Card key={idx} className={`p-5 border shadow-xs ${stat.color} transition-all hover:shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide uppercase">{stat.label}</span>
              <stat.icon className="w-5 h-5 opacity-80" />
            </div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight">
              {isLoading ? <span className="inline-block h-8 w-12 bg-black/10 rounded animate-pulse" /> : stat.value ?? 0}
            </div>
          </Card>
        ))}
      </div>

      {/* Overdue alert banner — only shown when there's something to flag */}
      {!!counts?.overdue_allocations && (
        <button
          onClick={() => navigate('/transfers')}
          className="w-full text-left bg-red-100 border-2 border-red-400 text-red-900 px-4 py-3.5 rounded-lg font-semibold text-sm flex items-center shadow-xs hover:bg-red-200 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 text-red-600 animate-pulse" />
          <span>
            {counts.overdue_allocations} asset{counts.overdue_allocations === 1 ? '' : 's'} overdue for return — flagged for follow-up
          </span>
        </button>
      )}

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
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded" />
                <div className="h-4 bg-slate-200 rounded w-5/6" />
                <div className="h-4 bg-slate-200 rounded w-4/6" />
              </div>
            ) : data && data.recent_activity.length > 0 ? (
              <ul className="space-y-3.5 text-sm font-medium text-slate-800 divide-y divide-slate-100">
                {data.recent_activity.map((entry) => (
                  <li key={entry.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <span className="truncate">
                      {humanizeAction(entry.action)}
                      {entry.user_name ? ` — ${entry.user_name}` : ''}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex-shrink-0">{formatRelativeTime(entry.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No recent activity to show for your role.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

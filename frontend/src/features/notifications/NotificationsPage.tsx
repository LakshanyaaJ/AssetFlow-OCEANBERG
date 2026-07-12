import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { CheckCircle2, AlertTriangle, ArrowRightLeft, CalendarCheck } from 'lucide-react';

export function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'alerts' | 'approvals' | 'bookings'>('all');

  const logs = [
    {
      id: 1,
      type: 'approvals',
      title: 'Laptop AF-0114 assigned to Priya shah',
      time: '2m ago',
      icon: CheckCircle2,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      id: 2,
      type: 'approvals',
      title: 'Maintenance request AF-0055 approved',
      time: '18m ago',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 3,
      type: 'bookings',
      title: 'Booking confirmed : Room B12 : 2:00 to 3:00 PM',
      time: '1h ago',
      icon: CalendarCheck,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 4,
      type: 'approvals',
      title: 'Transfer approved : AF-0023 to Facilities dept',
      time: '2h ago',
      icon: ArrowRightLeft,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      id: 5,
      type: 'alerts',
      title: 'Overdue return : AF-0021 was due 3 days ago',
      time: '1d ago',
      icon: AlertTriangle,
      color: 'text-amber-700 bg-amber-50 border-amber-300',
    },
    {
      id: 6,
      type: 'alerts',
      title: 'Audit discrepancy flagged : AF-0088 damaged',
      time: '2d ago',
      icon: AlertTriangle,
      color: 'text-red-700 bg-red-50 border-red-300 font-semibold',
    },
  ];

  const filteredLogs = filter === 'all' ? logs : logs.filter((l) => l.type === filter);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Filters */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Activity logs & Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Chronological audit trail of all enterprise asset movements, approvals, and system alerts.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="mt-4 sm:mt-0 flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('alerts')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filter === 'alerts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alerts
          </button>
          <button
            onClick={() => setFilter('approvals')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filter === 'approvals' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approvals
          </button>
          <button
            onClick={() => setFilter('bookings')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filter === 'bookings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bookings
          </button>
        </div>
      </div>

      {/* Activity Logs Stream */}
      <Card className="p-4 border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No notifications found across this category.</div>
        ) : (
          filteredLogs.map((item) => (
            <div key={item.id} className="py-3.5 px-2 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-lg border ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-800">{item.title}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{item.time}</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

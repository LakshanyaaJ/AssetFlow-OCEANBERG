import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, AlertTriangle, Info, XCircle, Clock, CheckCheck } from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from './api/useNotifications';
import { formatRelativeTime } from '../../lib/format';
import { Notification } from '../../types';

type Filter = 'all' | 'unread' | 'alerts' | 'approvals';

const TYPE_STYLE: Record<Notification['n_type'], { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  success: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  warning: { icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-300' },
  error: { icon: XCircle, color: 'text-red-700 bg-red-50 border-red-300' },
  approval: { icon: CheckCircle2, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  overdue: { icon: Clock, color: 'text-red-700 bg-red-50 border-red-300 font-semibold' },
};

const ALERT_TYPES: Notification['n_type'][] = ['warning', 'error', 'overdue'];

export function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data: notifications = [], isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'alerts') return ALERT_TYPES.includes(n.n_type);
    if (filter === 'approvals') return n.n_type === 'approval';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const pills: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
    { key: 'alerts', label: 'Alerts' },
    { key: 'approvals', label: 'Approvals' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Filters */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Alerts, approvals, and system messages addressed to your account.
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllRead.mutate()}
              isLoading={markAllRead.isPending}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
            {pills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setFilter(pill.key)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  filter === pill.key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Stream */}
      <Card className="p-4 border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading notifications…</div>
        ) : isError ? (
          <div className="py-12 text-center text-red-500 text-sm">Couldn't load notifications.</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No notifications found in this category.</div>
        ) : (
          filtered.map((item) => {
            const style = TYPE_STYLE[item.n_type] ?? TYPE_STYLE.info;
            const Icon = style.icon;
            return (
              <button
                key={item.id}
                onClick={() => !item.is_read && markRead.mutate(item.id)}
                className="w-full text-left py-3.5 px-2 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`p-2 rounded-lg border flex-shrink-0 ${style.color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!item.is_read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />}
                      <span className={`text-xs sm:text-sm truncate ${item.is_read ? 'font-medium text-slate-600' : 'font-semibold text-slate-900'}`}>
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{item.message}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono whitespace-nowrap flex-shrink-0">
                  {formatRelativeTime(item.created_at)}
                </span>
              </button>
            );
          })
        )}
      </Card>
    </div>
  );
}

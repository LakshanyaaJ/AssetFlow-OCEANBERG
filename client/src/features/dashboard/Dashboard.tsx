import {
  Users,
  Box,
  CalendarCheck,
  Wrench,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';

const stats = [
  { name: 'Total Assets', stat: '8,423', icon: Box, change: '122', changeType: 'increase' },
  { name: 'Active Allocations', stat: '5,102', icon: Users, change: '15', changeType: 'increase' },
  { name: 'Pending Maintenance', stat: '43', icon: Wrench, change: '3', changeType: 'decrease' },
  { name: 'Today\'s Bookings', stat: '28', icon: CalendarCheck, change: '12', changeType: 'increase' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard Overview
        </h2>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            Last 30 Days
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-xl bg-white px-4 pb-12 pt-5 shadow-sm ring-1 ring-gray-900/5 sm:px-6 sm:pt-6 hover:shadow-md transition-shadow duration-200"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
              <p
                className={classNames(
                  item.changeType === 'increase' ? 'text-green-600' : 'text-red-600',
                  'ml-2 flex items-baseline text-sm font-semibold'
                )}
              >
                {item.changeType === 'increase' ? (
                  <TrendingUp className="h-4 w-4 flex-shrink-0 self-center text-green-500 mr-1" aria-hidden="true" />
                ) : (
                  <TrendingUp className="h-4 w-4 flex-shrink-0 self-center text-red-500 mr-1 transform rotate-180" aria-hidden="true" />
                )}
                <span className="sr-only"> {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by </span>
                {item.change}
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
                    View all<span className="sr-only"> {item.name} stats</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent Activity" description="Latest actions across the organization" />
          <CardContent>
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {[1, 2, 3, 4, 5].map((item, itemIdx) => (
                  <li key={item}>
                    <div className="relative pb-8">
                      {itemIdx !== 4 ? (
                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <Box className="h-4 w-4 text-white" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500">
                              Asset <span className="font-medium text-gray-900">MacBook Pro (AST-2026-004)</span> was allocated to <span className="font-medium text-gray-900">Sarah Jenkins</span>
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime="2026-07-12">2h ago</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Pending Approvals" description="Requires your attention" />
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">Transfer Request #TR-892</span>
                  <span className="text-sm text-gray-600">AST-2026-042 to New York Branch</span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Reject</button>
                  <button className="px-3 py-1 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700">Approve</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">Maintenance Request #MR-102</span>
                  <span className="text-sm text-gray-600">HVAC Unit 4 - Repair needed</span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Reject</button>
                  <button className="px-3 py-1 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700">Approve</button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

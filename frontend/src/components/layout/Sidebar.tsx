import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Box, 
  ArrowRightLeft, 
  CalendarCheck, 
  Wrench,
  ShieldCheck,
  Building2,
  BarChart3,
  Bell
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Organization setup', href: '/org', icon: Building2 },
  { name: 'Assets', href: '/assets', icon: Box },
  { name: 'Allocation & Transfer', href: '/transfers', icon: ArrowRightLeft },
  { name: 'Resource Booking', href: '/bookings', icon: CalendarCheck },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Audit', href: '/audits', icon: ShieldCheck },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-800">
      <div className="flex items-center justify-center h-16 bg-slate-950 px-4">
        <h1 className="text-xl font-bold text-white tracking-tight">
          <span className="text-indigo-500">Asset</span>Flow
        </h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200'
              )}
            >
              <item.icon
                className={classNames(
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                  'flex-shrink-0 -ml-1 mr-3 h-5 w-5 transition-colors duration-200'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

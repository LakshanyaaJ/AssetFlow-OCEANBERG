import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get<{ data: { count: number } }>('/notifications/unread-count');
      return res.data.data.count;
    },
    refetchInterval: 60_000,
  });
}

export function TopNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: unreadCount } = useUnreadCount();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/assets?search=${encodeURIComponent(q)}`);
  }

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="flex flex-1 items-center">
        <form onSubmit={handleSearchSubmit} className="w-full max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow duration-200"
            placeholder="Search assets by name, tag, or serial number..."
          />
        </form>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 text-gray-400 hover:text-gray-500 relative transition-colors duration-200"
          aria-label="Notifications"
        >
          {!!unreadCount && (
            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
          <Bell className="h-6 w-6" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="relative flex items-center cursor-pointer group"
          >
            <UserCircle className="h-8 w-8 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
            <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
              {user?.fullName ?? 'Account'}
            </span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import { Bell, Search, UserCircle } from 'lucide-react';

export function TopNav() {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="flex flex-1 items-center">
        <div className="w-full max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow duration-200"
            placeholder="Search assets, resources, employees..."
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-400 hover:text-gray-500 relative transition-colors duration-200">
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          <Bell className="h-6 w-6" />
        </button>
        <div className="relative flex items-center cursor-pointer group">
          <UserCircle className="h-8 w-8 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
          <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
            Admin User
          </span>
        </div>
      </div>
    </header>
  );
}

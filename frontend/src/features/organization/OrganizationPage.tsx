import { useState } from 'react';
import { DepartmentsTab } from './components/DepartmentsTab';
import { LocationsTab } from './components/LocationsTab';
import { EmployeesTab } from './components/EmployeesTab';
import { Building2, MapPin, Users } from 'lucide-react';

export function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<'Departments' | 'Locations' | 'Employees'>('Departments');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Organization Setup</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your enterprise structure, physical locations, and employee directory.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('Departments')}
              className={`flex items-center whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'Departments'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className={`w-4 h-4 mr-2 ${activeTab === 'Departments' ? 'text-indigo-600' : 'text-gray-400'}`} />
              Departments
            </button>
            <button
              onClick={() => setActiveTab('Locations')}
              className={`flex items-center whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'Locations'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MapPin className={`w-4 h-4 mr-2 ${activeTab === 'Locations' ? 'text-indigo-600' : 'text-gray-400'}`} />
              Locations
            </button>
            <button
              onClick={() => setActiveTab('Employees')}
              className={`flex items-center whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'Employees'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className={`w-4 h-4 mr-2 ${activeTab === 'Employees' ? 'text-indigo-600' : 'text-gray-400'}`} />
              Employees
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'Departments' && <DepartmentsTab />}
          {activeTab === 'Locations' && <LocationsTab />}
          {activeTab === 'Employees' && <EmployeesTab />}
        </div>
      </div>
    </div>
  );
}

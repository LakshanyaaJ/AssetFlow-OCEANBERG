import { useState } from 'react';
import { DepartmentsTab } from './components/DepartmentsTab';
import { LocationsTab } from './components/LocationsTab';
import { CategoriesTab } from './components/CategoriesTab';
import { Building2, MapPin, Tag, Info } from 'lucide-react';

export function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<'Departments' | 'Categories' | 'Locations'>('Departments');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Organization setup</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your enterprise departments, asset categories, and physical locations.
        </p>
      </div>

      {/* Tabs matching wireframe Screen 3 — each tab owns its own contextual "Create" action */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 flex flex-wrap items-center justify-between px-4">
          <nav className="flex -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('Departments')}
              className={`flex items-center whitespace-nowrap py-4 px-6 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'Departments'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Building2 className={`w-4 h-4 mr-2 ${activeTab === 'Departments' ? 'text-slate-900' : 'text-slate-400'}`} />
              Departments
            </button>
            <button
              onClick={() => setActiveTab('Categories')}
              className={`flex items-center whitespace-nowrap py-4 px-6 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'Categories'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Tag className={`w-4 h-4 mr-2 ${activeTab === 'Categories' ? 'text-slate-900' : 'text-slate-400'}`} />
              Categories
            </button>
            <button
              onClick={() => setActiveTab('Locations')}
              className={`flex items-center whitespace-nowrap py-4 px-6 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'Locations'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <MapPin className={`w-4 h-4 mr-2 ${activeTab === 'Locations' ? 'text-slate-900' : 'text-slate-400'}`} />
              Locations
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'Departments' && <DepartmentsTab />}
          {activeTab === 'Locations' && <LocationsTab />}
          {activeTab === 'Categories' && <CategoriesTab />}
        </div>
      </div>

      {/* Wireframe Screen 3 Note Footer */}
      <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 text-slate-800 text-sm font-medium flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-600 flex-shrink-0" />
        <span>Adding a department here also drives the choices in screens 4 & 5</span>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { DepartmentsTab } from './components/DepartmentsTab';
import { LocationsTab } from './components/LocationsTab';
import { Building2, MapPin, Tag, Plus, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

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

      {/* Tabs with + Add button matching wireframe Screen 3 */}
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

          <div className="py-2">
            <Button
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded flex items-center shadow-xs"
              onClick={() => toast.success(`Add new ${activeTab.toLowerCase().slice(0, -1)} modal opened`)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              + Add
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'Departments' && <DepartmentsTab />}
          {activeTab === 'Locations' && <LocationsTab />}
          {activeTab === 'Categories' && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 font-semibold text-slate-600 text-left">
                    <tr>
                      <th className="px-6 py-3">Category Name</th>
                      <th className="px-6 py-3">Code</th>
                      <th className="px-6 py-3">Depreciation Rate</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-800 font-medium">
                    <tr>
                      <td className="px-6 py-4">Electronics</td>
                      <td className="px-6 py-4">ELEC</td>
                      <td className="px-6 py-4">33% / yr</td>
                      <td className="px-6 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Active</span></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">Furniture</td>
                      <td className="px-6 py-4">FURN</td>
                      <td className="px-6 py-4">10% / yr</td>
                      <td className="px-6 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Active</span></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">Field Equipment</td>
                      <td className="px-6 py-4">EQP</td>
                      <td className="px-6 py-4">20% / yr</td>
                      <td className="px-6 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

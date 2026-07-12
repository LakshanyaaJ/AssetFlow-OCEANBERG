import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAssets } from './api/useAssets';
import { AssetForm } from './AssetForm';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function AssetListPage() {
  const { data, isLoading, isError } = useAssets();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const statusColors: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    allocated: 'bg-blue-100 text-blue-800 border border-blue-300',
    in_transfer: 'bg-amber-100 text-amber-800 border border-amber-300',
    under_maintenance: 'bg-orange-100 text-orange-800 border border-orange-300',
    retired: 'bg-slate-100 text-slate-800 border border-slate-300',
    lost: 'bg-red-100 text-red-800 border border-red-300',
  };

  const filteredAssets = useMemo(() => {
    let list = data?.data || [];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(a =>
        a.asset_tag.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.serial_number && a.serial_number.toLowerCase().includes(q))
      );
    }
    if (categoryFilter) {
      list = list.filter(a => a.category_name === categoryFilter || String(a.category_id) === categoryFilter);
    }
    if (statusFilter) {
      list = list.filter(a => a.status === statusFilter);
    }
    return list;
  }, [data, searchTerm, categoryFilter, statusFilter, departmentFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Search and + Register Asset Button matching Screen 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tag, serial, or QR code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-2xs"
          />
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-lg flex items-center shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          + Register Asset
        </Button>
      </div>

      {/* 3 Filter Dropdowns Side-by-Side */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-2xs min-w-[140px]"
        >
          <option value="">Category</option>
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
          <option value="Field Equipment">Field Equipment</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-2xs min-w-[140px]"
        >
          <option value="">Status</option>
          <option value="available">Available</option>
          <option value="allocated">Allocated</option>
          <option value="under_maintenance">Maintenance</option>
          <option value="in_transfer">In Transfer</option>
        </select>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-2xs min-w-[140px]"
        >
          <option value="">Department</option>
          <option value="Engineering">Engineering</option>
          <option value="Facilities">Facilities</option>
          <option value="Field Ops">Field Ops</option>
          <option value="IT">IT</option>
        </select>
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Register New Asset"
      >
        <AssetForm 
          onCancel={() => setIsAddModalOpen(false)} 
          onSuccess={() => setIsAddModalOpen(false)} 
        />
      </Modal>

      {/* Table matching Screen 4 Columns: Tag | Name | Category | Status | Location */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-50 text-red-700 font-medium">Error loading assets directory.</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow className="bg-slate-50">
                <TableHeader className="font-bold text-slate-700 uppercase text-xs">Tag</TableHeader>
                <TableHeader className="font-bold text-slate-700 uppercase text-xs">Name</TableHeader>
                <TableHeader className="font-bold text-slate-700 uppercase text-xs">Category</TableHeader>
                <TableHeader className="font-bold text-slate-700 uppercase text-xs">Status</TableHeader>
                <TableHeader className="font-bold text-slate-700 uppercase text-xs">Location</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-bold text-slate-900 font-mono">
                    <a href={`/assets/${asset.id}`} className="hover:underline text-indigo-600">
                      {asset.asset_tag}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{asset.name}</div>
                    {asset.model && <div className="text-xs text-slate-500">{asset.model}</div>}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{asset.category_name || `Category ${asset.category_id}`}</TableCell>
                  <TableCell>
                    <span
                      className={classNames(
                        statusColors[asset.status] || 'bg-slate-100 text-slate-800 border border-slate-300',
                        'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold capitalize shadow-2xs'
                      )}
                    >
                      {asset.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{asset.location_name || `Location ${asset.location_id}`}</TableCell>
                </TableRow>
              ))}
              {filteredAssets.length === 0 && (
                <TableRow>
                  <TableCell className="text-center py-8 text-slate-500" colSpan={5}>
                    No assets matching the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

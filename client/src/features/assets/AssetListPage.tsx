import { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
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

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    allocated: 'bg-blue-100 text-blue-800',
    in_transfer: 'bg-yellow-100 text-yellow-800',
    under_maintenance: 'bg-orange-100 text-orange-800',
    retired: 'bg-gray-100 text-gray-800',
    lost: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Asset Directory
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            A complete list of all company assets including their status, location, and assignments.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Asset"
      >
        <AssetForm 
          onCancel={() => setIsAddModalOpen(false)} 
          onSuccess={() => setIsAddModalOpen(false)} 
        />
      </Modal>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">Error loading assets.</div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Asset Tag</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Category</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Location</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.map((asset) => (
              <TableRow key={asset.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="font-medium text-gray-900">
                  {asset.asset_tag}
                </TableCell>
                <TableCell>
                  <div className="text-gray-900">{asset.name}</div>
                  <div className="text-xs text-gray-500">{asset.model || asset.vendor}</div>
                </TableCell>
                <TableCell>{asset.category_name || `Category ${asset.category_id}`}</TableCell>
                <TableCell>
                  <span
                    className={classNames(
                      statusColors[asset.status] || 'bg-gray-100 text-gray-800',
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize'
                    )}
                  >
                    {asset.status.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell>{asset.location_name || `Location ${asset.location_id}`}</TableCell>
                <TableCell>
                  <a href={`/assets/${asset.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">
                    View<span className="sr-only">, {asset.name}</span>
                  </a>
                </TableCell>
              </TableRow>
            ))}
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={6}>
                  No assets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

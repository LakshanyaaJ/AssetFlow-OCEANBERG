import { useState, useMemo } from 'react';
import { useCategories, AssetCategory } from '../api/useOrganization';
import { Search, Plus, Edit } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { CategoryFormModal } from './CategoryFormModal';

const Badge = ({ active }: { active: boolean }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
  }`}>
    {active ? 'Active' : 'Inactive'}
  </span>
);

export function CategoriesTab() {
  const { data: categories = [], isLoading } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<AssetCategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!searchTerm) return categories;
    const q = searchTerm.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [categories, searchTerm]);

  function openCreate() {
    setEditing(null);
    setIsModalOpen(true);
  }

  function openEdit(category: AssetCategory) {
    setEditing(category);
    setIsModalOpen(true);
  }

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading categories...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search categories..."
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Create Category
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 font-semibold text-slate-600 text-left">
            <tr>
              <th className="px-6 py-3">Category Name</th>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Parent</th>
              <th className="px-6 py-3">Depreciation Rate</th>
              <th className="px-6 py-3 text-right">Assets</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-800 font-medium">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4">{c.name}</td>
                <td className="px-6 py-4 font-mono text-xs">{c.code}</td>
                <td className="px-6 py-4 text-slate-500">{c.parent_name || '—'}</td>
                <td className="px-6 py-4">{c.depreciation_rate != null ? `${c.depreciation_rate}% / yr` : '—'}</td>
                <td className="px-6 py-4 text-right">{c.asset_count}</td>
                <td className="px-6 py-4"><Badge active={c.is_active} /></td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openEdit(c)}
                    className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Category' : 'Create Category'}>
        <CategoryFormModal
          initialData={editing ?? undefined}
          onCancel={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

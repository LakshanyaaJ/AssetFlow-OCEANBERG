import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDepartments, Department } from '../api/useOrganization';
import { Search, Plus, ChevronRight, ChevronDown, Edit } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { DepartmentFormModal } from './DepartmentFormModal';

// Badge Component for Status
const Badge = ({ status }: { status: string }) => {
  const bg = status === 'Active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-500' : 'bg-slate-100 text-slate-800 border border-slate-400';
  return <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold shadow-2xs ${bg}`}>{status}</span>;
};

export function DepartmentsTab() {
  const { data: departments = [], isLoading } = useDepartments();
  const [searchTerm, setSearchTerm] = useState('');
  const [isTreeView, setIsTreeView] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['1', '2', '5'])); // Default expand some parents
  const [editing, setEditing] = useState<Department | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function openCreate() {
    setEditing(null);
    setIsModalOpen(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setIsModalOpen(true);
  }

  // Build tree hierarchy
  const buildTree = (nodes: Department[], parentId: string | null = null, depth = 0): (Department & { depth: number; hasChildren: boolean })[] => {
    let result: (Department & { depth: number; hasChildren: boolean })[] = [];
    
    // Sort by name for consistent ordering
    const children = nodes.filter(n => n.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name));
    
    for (const child of children) {
      const childrenOfChild = nodes.filter(n => n.parent_id === child.id);
      const hasChildren = childrenOfChild.length > 0;
      
      result.push({ ...child, depth, hasChildren });
      
      if (hasChildren && expandedRows.has(child.id)) {
        result = result.concat(buildTree(nodes, child.id, depth + 1));
      }
    }
    return result;
  };

  const filteredData = useMemo(() => {
    let filtered = departments;
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return filtered; // Return flat list when searching
    }
    return isTreeView ? buildTree(filtered) : filtered;
  }, [departments, searchTerm, isTreeView, expandedRows]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading departments...</div>;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search departments..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="bg-white" onClick={() => { setIsTreeView(!isTreeView); setSearchTerm(''); }}>
            {isTreeView ? 'List View' : 'Tree View'}
          </Button>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2"/> Create Department
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Head</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Assets</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="flex items-center" 
                      style={{ paddingLeft: isTreeView && !searchTerm ? `${('depth' in dept ? (dept as any).depth : 0) * 1.5}rem` : '0' }}
                    >
                      {isTreeView && !searchTerm && (
                        <div className="w-6 flex justify-center mr-1">
                          {('hasChildren' in dept && (dept as any).hasChildren) ? (
                            <button onClick={() => toggleExpand(dept.id)} className="text-gray-500 hover:text-indigo-600 focus:outline-none">
                              {expandedRows.has(dept.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          ) : (
                            <span className="w-4 h-4 inline-block"></span>
                          )}
                        </div>
                      )}
                      <Link to={`/departments/${dept.id}`} className={`font-medium text-indigo-600 hover:text-indigo-900 hover:underline ${isTreeView && !searchTerm && ('depth' in dept && (dept as any).depth === 0) ? 'font-bold' : ''}`}>
                        {dept.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.head_name || <span className="text-gray-400 italic">Unassigned</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{dept.employees_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{dept.assets_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><Badge status={dept.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-gray-400 hover:text-indigo-600" onClick={() => openEdit(dept)}>
                        <Edit className="w-4 h-4"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No departments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredData.length}</span> departments
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Department' : 'Create Department'}>
        <DepartmentFormModal
          initialData={editing ?? undefined}
          onCancel={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

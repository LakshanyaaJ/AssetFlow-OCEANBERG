import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLocations, Location } from '../api/useOrganization';
import { Search, Plus, ChevronRight, ChevronDown, Edit, MapPin, GripVertical } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { LocationFormModal } from './LocationFormModal';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../../../lib/api';

const Badge = ({ status }: { status: string }) => {
  const bg = status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 
             status === 'Under Maintenance' ? 'bg-amber-100 text-amber-800' : 
             'bg-red-100 text-red-800';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg}`}>{status}</span>;
};

export function LocationsTab() {
  const { data: serverLocations = [], isLoading } = useLocations();
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['1', '4']));
  const [editing, setEditing] = useState<Location | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  function openCreate() {
    setEditing(null);
    setIsModalOpen(true);
  }

  function openEdit(loc: Location) {
    setEditing(loc);
    setIsModalOpen(true);
  }

  // Drag and Drop State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (serverLocations.length > 0) {
      setLocations(serverLocations);
    }
  }, [serverLocations]);

  // Build tree hierarchy
  const buildTree = (nodes: Location[], parentId: string | null = null, depth = 0): (Location & { depth: number; hasChildren: boolean })[] => {
    let result: (Location & { depth: number; hasChildren: boolean })[] = [];
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
    let filtered = locations;
    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.building.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return filtered;
    }
    return buildTree(filtered);
  }, [locations, searchTerm, expandedRows]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  // DnD Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to keep the drag image visible while ghosting original
    setTimeout(() => {
      const el = document.getElementById(`loc-${id}`);
      if (el) el.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (_e: React.DragEvent, id: string) => {
    setDraggedId(null);
    setDragOverId(null);
    const el = document.getElementById(`loc-${id}`);
    if (el) el.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault(); // Necessary to allow dropping
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    // Prevent dropping a parent into its own child (circular dependency guard)
    const isChild = (possibleChildId: string, possibleParentId: string): boolean => {
      let current = locations.find(l => l.id === possibleChildId);
      while (current && current.parent_id) {
        if (current.parent_id === possibleParentId) return true;
        current = locations.find(l => l.id === current?.parent_id);
      }
      return false;
    };

    if (isChild(targetId, draggedId)) {
      setDragOverId(null);
      return; // Invalid move
    }

    const movedId = draggedId;
    setLocations(prev => prev.map(loc => {
      if (loc.id === movedId) {
        return { ...loc, parent_id: targetId };
      }
      return loc;
    }));

    // Auto expand the new parent
    setExpandedRows(prev => new Set(prev).add(targetId));
    setDragOverId(null);

    api.patch(`/locations/${movedId}`, { parent_id: Number(targetId) })
      .then(() => {
        toast.success('Location hierarchy updated');
        queryClient.invalidateQueries({ queryKey: ['locations'] });
      })
      .catch((err) => {
        toast.error(apiErrorMessage(err));
        setLocations(serverLocations); // revert the optimistic move
      });
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading locations...</div>;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search locations..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2"/> Create Location
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-10 px-6 py-3"></th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building / Floor</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((loc) => (
                <tr 
                  id={`loc-${loc.id}`}
                  key={loc.id} 
                  draggable={!searchTerm} // Only draggable in tree view
                  onDragStart={(e) => handleDragStart(e, loc.id)}
                  onDragEnd={(e) => handleDragEnd(e, loc.id)}
                  onDragOver={(e) => handleDragOver(e, loc.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, loc.id)}
                  className={`group transition-colors ${dragOverId === loc.id ? 'bg-indigo-50 border-t-2 border-indigo-400' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-2 py-4 whitespace-nowrap cursor-move text-gray-300 hover:text-gray-500 transition-colors">
                    {!searchTerm && <GripVertical className="w-4 h-4 ml-4" />}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="flex items-center" 
                      style={{ paddingLeft: !searchTerm ? `${('depth' in loc ? (loc as any).depth : 0) * 1.5}rem` : '0' }}
                    >
                      {!searchTerm && (
                        <div className="w-6 flex justify-center mr-1">
                          {('hasChildren' in loc && (loc as any).hasChildren) ? (
                            <button onClick={() => toggleExpand(loc.id)} className="text-gray-500 hover:text-indigo-600 focus:outline-none">
                              {expandedRows.has(loc.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          ) : (
                            <MapPin className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                      )}
                      <Link to={`/locations/${loc.id}`} className={`font-medium text-indigo-600 hover:text-indigo-900 hover:underline ${!searchTerm && ('depth' in loc && (loc as any).depth === 0) ? 'font-bold' : ''}`}>
                        {loc.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {loc.building} {loc.floor && <span className="text-gray-400">/ Fl. {loc.floor}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{loc.capacity}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><Badge status={loc.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-gray-400 hover:text-indigo-600" onClick={() => openEdit(loc)}>
                        <Edit className="w-4 h-4"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No locations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredData.length}</span> locations
          </div>
          <div className="text-xs text-gray-400 italic flex items-center gap-1">
            <GripVertical className="w-3 h-3" /> Drag rows to reorder hierarchy
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Location' : 'Create Location'}>
        <LocationFormModal
          initialData={editing ?? undefined}
          onCancel={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

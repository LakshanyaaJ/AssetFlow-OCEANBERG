import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useResources, useBookings, useCancelBooking, useDeleteResource, useUpdateResource, Resource } from './api/useBookings';
import { BookResourceModal } from './components/BookResourceModal';
import { ResourceFormModal } from './components/ResourceFormModal';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { CalendarCheck, Plus, Edit, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../../lib/api';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function BookingsPage() {
  const { hasPermission, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'resources' | 'bookings'>('resources');

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<number | undefined>(undefined);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | undefined>(undefined);

  // Queries
  const { data: resourcesData, isLoading: loadingResources } = useResources();
  const { data: bookingsData, isLoading: loadingBookings } = useBookings();

  // Mutations
  const cancelBooking = useCancelBooking();
  const deleteResource = useDeleteResource();
  const updateResource = useUpdateResource();

  const handleCancelBooking = (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    cancelBooking.mutate(id, {
      onSuccess: () => {
        toast.success('Booking cancelled successfully');
      },
      onError: (err) => {
        toast.error(apiErrorMessage(err));
      },
    });
  };

  const handleDeleteResource = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resource? This will soft-delete the resource.')) return;
    deleteResource.mutate(id, {
      onSuccess: () => {
        toast.success('Resource deleted successfully');
      },
      onError: (err) => {
        toast.error(apiErrorMessage(err));
      },
    });
  };

  const handleToggleResourceActive = (resource: Resource) => {
    const nextActive = !resource.is_active;
    updateResource.mutate(
      { id: resource.id, is_active: nextActive },
      {
        onSuccess: () => {
          toast.success(`Resource ${nextActive ? 'activated' : 'deactivated'}`);
        },
        onError: (err) => {
          toast.error(apiErrorMessage(err));
        },
      }
    );
  };

  const openBookModal = (resourceId: number) => {
    setSelectedResourceId(resourceId);
    setIsBookModalOpen(true);
  };

  const openResourceFormModal = (resource?: Resource) => {
    setSelectedResource(resource);
    setIsResourceModalOpen(true);
  };

  const resourceTypes = {
    meeting_room: 'Meeting Room',
    workspace: 'Workspace / Desk',
    vehicle: 'Company Vehicle',
    equipment: 'Equipment',
  };

  const statusColors = {
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Resource Booking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Book meeting rooms, company vehicles, workspaces, and specialized equipment.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-3">
          {hasPermission('booking.create') && (
            <Button onClick={() => { setSelectedResourceId(undefined); setIsBookModalOpen(true); }} className="flex items-center">
              <CalendarCheck className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          )}
          {hasPermission('resource.manage') && (
            <Button variant="outline" onClick={() => openResourceFormModal(undefined)} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          )}
        </div>
      </div>

      {/* Main Card Layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('resources')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'resources'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bookable Resources
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bookings'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Reservations
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'resources' ? (
            loadingResources ? (
              <div className="text-center py-8 text-gray-500">Loading resources...</div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>Location</TableHeader>
                    <TableHeader>Capacity</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resourcesData?.data.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="text-gray-900 font-semibold">{resource.name}</div>
                        <div className="text-xs text-gray-500">{resource.code}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {resourceTypes[resource.resource_type] || resource.resource_type}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{resource.location_name}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {resource.capacity ? `${resource.capacity} people` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={classNames(
                            resource.is_active
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200',
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize'
                          )}
                        >
                          {resource.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {resource.is_active && hasPermission('booking.create') && (
                            <Button size="sm" variant="outline" onClick={() => openBookModal(resource.id)}>
                              Book
                            </Button>
                          )}
                          {hasPermission('resource.manage') && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => openResourceFormModal(resource)}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={resource.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}
                                onClick={() => handleToggleResourceActive(resource)}
                                title={resource.is_active ? 'Deactivate' : 'Activate'}
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteResource(resource.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {resourcesData?.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No bookable resources found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )
          ) : loadingBookings ? (
            <div className="text-center py-8 text-gray-500">Loading reservations...</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Resource</TableHeader>
                  <TableHeader>Booked By</TableHeader>
                  <TableHeader>Purpose</TableHeader>
                  <TableHeader>Start Time</TableHeader>
                  <TableHeader>End Time</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookingsData?.data.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="text-gray-900 font-semibold">{booking.resource_name}</div>
                      <div className="text-xs text-gray-500">[{booking.resource_code}]</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{booking.booked_by_name}</TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-xs truncate" title={booking.purpose}>
                      {booking.purpose}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(booking.starts_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(booking.ends_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={classNames(
                          statusColors[booking.status] || 'bg-gray-100 text-gray-800',
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize'
                        )}
                      >
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {booking.status === 'confirmed' && (hasPermission('booking.manage') || user?.id === booking.booked_by) && (
                        <Button size="sm" variant="danger" onClick={() => handleCancelBooking(booking.id)}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {bookingsData?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No reservations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Book Resource Modal */}
      <Modal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title="Book Resource">
        <BookResourceModal
          preselectedResourceId={selectedResourceId}
          onCancel={() => setIsBookModalOpen(false)}
          onSuccess={() => setIsBookModalOpen(false)}
        />
      </Modal>

      {/* Resource Form Modal (Create / Edit) */}
      <Modal isOpen={isResourceModalOpen} onClose={() => setIsResourceModalOpen(false)} title={selectedResource ? 'Edit Resource' : 'Add Resource'}>
        <ResourceFormModal
          initialData={selectedResource}
          onCancel={() => setIsResourceModalOpen(false)}
          onSuccess={() => setIsResourceModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

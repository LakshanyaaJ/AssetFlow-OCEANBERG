import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAllocations, useTransfers, useCompleteTransfer, useCancelTransfer } from './api/useTransfersAndAllocations';
import { AllocateModal } from './components/AllocateModal';
import { ReturnModal } from './components/ReturnModal';
import { TransferRequestModal } from './components/TransferRequestModal';
import { TransferDecisionModal } from './components/TransferDecisionModal';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { ArrowRightLeft, UserCheck, CheckCircle2, XCircle, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../../lib/api';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function TransfersPage() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'allocations' | 'transfers'>('allocations');

  // Modals state
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedAllocationId, setSelectedAllocationId] = useState<number | null>(null);

  const [isTransferRequestOpen, setIsTransferRequestOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected'>('approved');

  // Data fetching
  const { data: allocationsData, isLoading: loadingAllocations } = useAllocations();
  const { data: transfersData, isLoading: loadingTransfers } = useTransfers();

  // Actions
  const completeTransfer = useCompleteTransfer();
  const cancelTransfer = useCancelTransfer();

  const handleCompleteTransfer = (id: number) => {
    if (!window.confirm('Mark this transfer as completed? The asset location will be updated.')) return;
    completeTransfer.mutate(id, {
      onSuccess: () => {
        toast.success('Transfer completed successfully');
      },
      onError: (err) => {
        toast.error(apiErrorMessage(err));
      },
    });
  };

  const handleCancelTransfer = (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this transfer request?')) return;
    cancelTransfer.mutate(id, {
      onSuccess: () => {
        toast.success('Transfer request cancelled');
      },
      onError: (err) => {
        toast.error(apiErrorMessage(err));
      },
    });
  };

  const openReturnModal = (id: number) => {
    setSelectedAllocationId(id);
    setIsReturnOpen(true);
  };

  const openDecisionModal = (id: number, type: 'approved' | 'rejected') => {
    setSelectedTransferId(id);
    setDecisionType(type);
    setIsDecisionOpen(true);
  };

  const statusColors = {
    // Allocation Statuses
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    returned: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
    // Transfer Statuses
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Allocations & Transfers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track asset handovers to employees and physical relocation requests.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-3">
          {hasPermission('allocation.manage') && (
            <Button onClick={() => setIsAllocateOpen(true)} className="flex items-center">
              <UserCheck className="w-4 h-4 mr-2" />
              Allocate Asset
            </Button>
          )}
          {hasPermission('transfer.request') && (
            <Button variant="outline" onClick={() => setIsTransferRequestOpen(true)} className="flex items-center">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Request Transfer
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('allocations')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'allocations'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Asset Allocations
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'transfers'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transfer Requests
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'allocations' ? (
            loadingAllocations ? (
              <div className="text-center py-8 text-gray-500">Loading allocations...</div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Asset</TableHeader>
                    <TableHeader>Allocated To</TableHeader>
                    <TableHeader>Allocated By</TableHeader>
                    <TableHeader>Allocated At</TableHeader>
                    <TableHeader>Due Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allocationsData?.data.map((allocation) => {
                    const statusStr = allocation.returned_at
                      ? 'returned'
                      : allocation.is_overdue
                      ? 'overdue'
                      : 'active';

                    return (
                      <TableRow key={allocation.id}>
                        <TableCell>
                          <a href={`/assets/${allocation.asset_id}`} className="font-semibold text-indigo-600 hover:underline">
                            {allocation.asset_name}
                          </a>
                          <div className="text-xs text-gray-500">{allocation.asset_tag}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-900 font-medium">{allocation.employee_name}</div>
                          <div className="text-xs text-gray-500">{allocation.employee_code}</div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{allocation.allocated_by_name}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(allocation.allocated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {allocation.due_at ? new Date(allocation.due_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={classNames(
                              statusColors[statusStr] || 'bg-gray-100 text-gray-800',
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize'
                            )}
                          >
                            {statusStr}
                          </span>
                        </TableCell>
                        <TableCell>
                          {!allocation.returned_at && hasPermission('allocation.manage') && (
                            <Button size="sm" variant="outline" onClick={() => openReturnModal(allocation.id)}>
                              Return
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {allocationsData?.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No asset allocations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )
          ) : loadingTransfers ? (
            <div className="text-center py-8 text-gray-500">Loading transfers...</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Asset</TableHeader>
                  <TableHeader>Route</TableHeader>
                  <TableHeader>Reason</TableHeader>
                  <TableHeader>Requested By</TableHeader>
                  <TableHeader>Requested At</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfersData?.data.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <a href={`/assets/${transfer.asset_id}`} className="font-semibold text-indigo-600 hover:underline">
                        {transfer.asset_name}
                      </a>
                      <div className="text-xs text-gray-500">{transfer.asset_tag}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 font-medium">
                        {transfer.from_location_name} &rarr; {transfer.to_location_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-xs truncate" title={transfer.reason}>
                      {transfer.reason}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{transfer.requested_by_name}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(transfer.requested_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={classNames(
                          statusColors[transfer.status] || 'bg-gray-100 text-gray-800',
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize'
                        )}
                      >
                        {transfer.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {transfer.status === 'pending' && hasPermission('transfer.approve') && (
                          <>
                            <Button size="sm" onClick={() => openDecisionModal(transfer.id, 'approved')}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => openDecisionModal(transfer.id, 'rejected')}>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {transfer.status === 'pending' && hasPermission('transfer.request') && (
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleCancelTransfer(transfer.id)}>
                            <Ban className="w-3.5 h-3.5 mr-1" /> Cancel
                          </Button>
                        )}
                        {transfer.status === 'approved' && hasPermission('transfer.approve') && (
                          <Button size="sm" onClick={() => handleCompleteTransfer(transfer.id)}>
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {transfersData?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No transfer requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Allocate Asset Modal */}
      <Modal isOpen={isAllocateOpen} onClose={() => setIsAllocateOpen(false)} title="Allocate Asset">
        <AllocateModal onCancel={() => setIsAllocateOpen(false)} onSuccess={() => setIsAllocateOpen(false)} />
      </Modal>

      {/* Return Asset Modal */}
      <Modal isOpen={isReturnOpen} onClose={() => setIsReturnOpen(false)} title="Process Return">
        {selectedAllocationId && (
          <ReturnModal
            allocationId={selectedAllocationId}
            onCancel={() => setIsReturnOpen(false)}
            onSuccess={() => setIsReturnOpen(false)}
          />
        )}
      </Modal>

      {/* Transfer Request Modal */}
      <Modal isOpen={isTransferRequestOpen} onClose={() => setIsTransferRequestOpen(false)} title="Request Transfer">
        <TransferRequestModal onCancel={() => setIsTransferRequestOpen(false)} onSuccess={() => setIsTransferRequestOpen(false)} />
      </Modal>

      {/* Transfer Decision Modal */}
      <Modal isOpen={isDecisionOpen} onClose={() => setIsDecisionOpen(false)} title="Resolve Transfer Request">
        {selectedTransferId && (
          <TransferDecisionModal
            transferId={selectedTransferId}
            initialDecision={decisionType}
            onCancel={() => setIsDecisionOpen(false)}
            onSuccess={() => setIsDecisionOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}

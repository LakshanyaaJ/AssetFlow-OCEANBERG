import { useState } from 'react';
import { useAllocations, useTransfers, useCompleteTransfer, useCancelTransfer } from './api/useTransfersAndAllocations';
import { useAuth } from '../auth/AuthContext';
import { AllocateModal } from './components/AllocateModal';
import { ReturnModal } from './components/ReturnModal';
import { TransferRequestModal } from './components/TransferRequestModal';
import { TransferDecisionModal } from './components/TransferDecisionModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../../lib/api';
import { formatDate, formatDateTime, humanize } from '../../lib/format';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const transferStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

export function TransfersPage() {
  const { user, hasPermission } = useAuth();
  const canApproveTransfers = hasPermission('transfer.approve');
  const canManageAllocations = hasPermission('allocation.manage');

  const [transferStatusFilter, setTransferStatusFilter] = useState('pending');

  // Modals state
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedAllocationId, setSelectedAllocationId] = useState<number | null>(null);
  const [isTransferRequestOpen, setIsTransferRequestOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected'>('approved');

  const { data: activeAllocations, isLoading: loadingAllocations, refetch: refetchAllocations } = useAllocations({ active: 'true', limit: 50 });
  const { data: recentAllocations } = useAllocations({ limit: 8 });
  const { data: transfersData, isLoading: loadingTransfers, refetch: refetchTransfers } = useTransfers(
    transferStatusFilter ? { status: transferStatusFilter, limit: 50 } : { limit: 50 },
  );
  const completeTransfer = useCompleteTransfer();
  const cancelTransfer = useCancelTransfer();

  function openReturn(allocationId: number) {
    setSelectedAllocationId(allocationId);
    setIsReturnOpen(true);
  }

  function openDecision(transferId: number, decision: 'approved' | 'rejected') {
    setSelectedTransferId(transferId);
    setDecisionType(decision);
    setIsDecisionOpen(true);
  }

  function handleComplete(id: number) {
    completeTransfer.mutate(id, {
      onSuccess: () => toast.success('Transfer marked complete'),
      onError: (err) => toast.error(apiErrorMessage(err)),
    });
  }

  function handleCancel(id: number) {
    cancelTransfer.mutate(id, {
      onSuccess: () => toast.success('Transfer request cancelled'),
      onError: (err) => toast.error(apiErrorMessage(err)),
    });
  }

  const allocations = activeAllocations?.data || [];
  const transfers = transfersData?.data || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Asset allocation & Transfer</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage direct allocations, review inter-employee returns, and decide transfer requests.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button onClick={() => setIsAllocateOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Allocation
          </Button>
          <Button onClick={() => setIsTransferRequestOpen(true)} variant="outline" className="border-slate-800 text-slate-800 text-xs font-semibold">
            Request Transfer
          </Button>
        </div>
      </div>

      {/* Active Allocations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Active Allocations</h2>
          <Button variant="outline" size="sm" onClick={() => refetchAllocations()} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
        <Card className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
          {loadingAllocations ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading active allocations…</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow className="bg-slate-50">
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Asset</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Employee</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Allocated</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Due</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs text-right">Action</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {allocations.map((a) => (
                  <TableRow key={a.id} className="hover:bg-slate-50">
                    <TableCell className="font-semibold text-slate-900">{a.asset_name} <span className="text-xs font-mono text-slate-400">({a.asset_tag})</span></TableCell>
                    <TableCell className="text-slate-700">{a.employee_name} <span className="text-xs text-slate-400">({a.employee_code})</span></TableCell>
                    <TableCell className="text-slate-600 text-sm">{formatDate(a.allocated_at)}</TableCell>
                    <TableCell className="text-sm">
                      {a.due_at ? (
                        <span className={a.is_overdue ? 'text-red-600 font-bold' : 'text-slate-600'}>{formatDate(a.due_at)}{a.is_overdue ? ' (Overdue)' : ''}</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageAllocations && (
                        <Button size="sm" variant="outline" onClick={() => openReturn(a.id)} className="text-xs">
                          Process Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {allocations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">No assets are currently allocated.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Transfer Requests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Transfer Requests</h2>
          <div className="flex items-center gap-2">
            <select
              value={transferStatusFilter}
              onChange={(e) => setTransferStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => refetchTransfers()} className="flex items-center gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>
        <Card className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
          {loadingTransfers ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading transfer requests…</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow className="bg-slate-50">
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Asset</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Route</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Requested By</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Status</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs text-right">Action</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((t) => (
                  <TableRow key={t.id} className="hover:bg-slate-50">
                    <TableCell className="font-semibold text-slate-900">{t.asset_name} <span className="text-xs font-mono text-slate-400">({t.asset_tag})</span></TableCell>
                    <TableCell className="text-slate-700 text-sm">{t.from_location_name} → {t.to_location_name}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{t.requested_by_name}<br /><span className="text-xs text-slate-400">{formatDateTime(t.requested_at)}</span></TableCell>
                    <TableCell>
                      <span className={classNames(transferStatusColors[t.status] || 'bg-gray-100 text-gray-800', 'px-2.5 py-0.5 rounded-full text-xs font-bold capitalize')}>
                        {humanize(t.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {t.status === 'pending' && canApproveTransfers && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => openDecision(t.id, 'approved')} className="text-xs">Approve</Button>
                            <Button size="sm" variant="danger" onClick={() => openDecision(t.id, 'rejected')} className="text-xs">Reject</Button>
                          </>
                        )}
                        {t.status === 'approved' && canApproveTransfers && (
                          <Button size="sm" variant="primary" onClick={() => handleComplete(t.id)} isLoading={completeTransfer.isPending} className="text-xs">Complete</Button>
                        )}
                        {t.status === 'pending' && t.requested_by === user?.id && (
                          <Button size="sm" variant="outline" onClick={() => handleCancel(t.id)} isLoading={cancelTransfer.isPending} className="text-xs">Cancel</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {transfers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">No transfer requests match this filter.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Recent Allocation Activity */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">Recent Allocation Activity</h2>
        <Card className="p-5 border border-slate-200 rounded-xl shadow-xs bg-white">
          {recentAllocations?.data && recentAllocations.data.length > 0 ? (
            <ul className="space-y-3 text-sm font-medium text-slate-800 divide-y divide-slate-100">
              {recentAllocations.data.map((a) => (
                <li key={a.id} className="pt-3 first:pt-0 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    {formatDate(a.allocated_at)} — Allocated to {a.employee_name} ({a.asset_tag})
                  </span>
                  <span
                    className={classNames(
                      a.is_active ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-500 bg-slate-100',
                      'text-xs font-mono px-2 py-0.5 rounded'
                    )}
                  >
                    {a.is_active ? 'Active' : 'Returned'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No allocation activity yet.</p>
          )}
        </Card>
      </div>

      {/* Modals */}
      <Modal isOpen={isAllocateOpen} onClose={() => setIsAllocateOpen(false)} title="New Asset Allocation">
        <AllocateModal onCancel={() => setIsAllocateOpen(false)} onSuccess={() => setIsAllocateOpen(false)} />
      </Modal>

      <Modal isOpen={isReturnOpen} onClose={() => setIsReturnOpen(false)} title="Return Asset">
        <ReturnModal
          onCancel={() => {
            setIsReturnOpen(false);
            setSelectedAllocationId(null);
          }}
          onSuccess={() => {
            setIsReturnOpen(false);
            setSelectedAllocationId(null);
          }}
          allocationId={selectedAllocationId || 0}
        />
      </Modal>

      <Modal isOpen={isTransferRequestOpen} onClose={() => setIsTransferRequestOpen(false)} title="Request Asset Transfer">
        <TransferRequestModal onCancel={() => setIsTransferRequestOpen(false)} onSuccess={() => setIsTransferRequestOpen(false)} />
      </Modal>

      <Modal isOpen={isDecisionOpen} onClose={() => setIsDecisionOpen(false)} title="Review Transfer Request">
        <TransferDecisionModal
          onCancel={() => {
            setIsDecisionOpen(false);
            setSelectedTransferId(null);
          }}
          onSuccess={() => {
            setIsDecisionOpen(false);
            setSelectedTransferId(null);
          }}
          transferId={selectedTransferId || 0}
          initialDecision={decisionType}
        />
      </Modal>
    </div>
  );
}

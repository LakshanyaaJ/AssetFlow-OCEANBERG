import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { AuditCycle, AuditItem, useStartAudit, useCompleteAudit, useCancelAudit } from '../api/useAudit';
import { VerifyItemModal } from './VerifyItemModal';
import { DiscrepancyReportModal } from './DiscrepancyReportModal';
import { apiErrorMessage } from '../../../lib/api';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, FileText, Play } from 'lucide-react';

interface AuditDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: AuditCycle | null;
  canManage: boolean;
}

export function AuditDetailsModal({ isOpen, onClose, cycle, canManage }: AuditDetailsModalProps) {
  const [selectedItem, setSelectedItem] = useState<AuditItem | null>(null);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const startMutation = useStartAudit();
  const completeMutation = useCompleteAudit();
  const cancelMutation = useCancelAudit();

  if (!cycle) return null;

  const items = cycle.items || [];
  const total = items.length;
  const checked = items.filter((i) => i.status !== 'pending').length;

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(cycle.id);
      toast.success('Audit cycle started! Asset snapshot captured.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const handleComplete = async () => {
    if (checked < total) {
      toast.error(`Cannot complete audit: ${total - checked} items still pending verification.`);
      return;
    }
    if (!window.confirm('Close audit and mark missing assets as Lost in database?')) return;
    try {
      await completeMutation.mutateAsync(cycle.id);
      toast.success('Audit cycle completed successfully!');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this audit cycle?')) return;
    try {
      await cancelMutation.mutateAsync(cycle.id);
      toast.success('Audit cycle cancelled');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    found: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    missing: 'bg-slate-900 text-white border-slate-800',
    damaged: 'bg-red-100 text-red-800 border-red-200',
    misplaced: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  // Activity Timeline
  const steps = [
    {
      title: 'Audit Created',
      desc: `Created by ${cycle.created_by_name} on ${new Date(cycle.created_at).toLocaleString()}`,
      done: true,
      active: cycle.status === 'draft',
    },
    {
      title: 'Auditors Assigned & Snapshot Taken',
      desc: cycle.status === 'draft' ? 'Waiting to start audit cycle...' : `Captured ${total} assets in scope for physical verification`,
      done: cycle.status !== 'draft',
      active: cycle.status === 'in_progress' && checked === 0,
    },
    {
      title: 'Assets Verified',
      desc: cycle.status === 'in_progress'
        ? `${checked} of ${total} items checked (${Math.round(total ? (checked / total) * 100 : 0)}%)`
        : cycle.status === 'completed'
        ? `All ${total} assets verified across expected locations`
        : 'Pending verification progress...',
      done: checked > 0 && checked === total,
      active: cycle.status === 'in_progress' && checked > 0 && checked < total,
    },
    {
      title: 'Discrepancies Found & Handled',
      desc: items.some((i) => ['missing', 'damaged', 'misplaced'].includes(i.status))
        ? `${items.filter((i) => ['missing', 'damaged', 'misplaced'].includes(i.status)).length} discrepancies flagged during inspection`
        : 'No discrepancies or pending close...',
      done: cycle.status === 'completed',
      active: cycle.status === 'in_progress' && checked === total,
    },
    {
      title: 'Audit Closed',
      desc: cycle.status === 'completed' ? 'Cycle officially signed off and archived' : 'Waiting for completion sign-off...',
      done: cycle.status === 'completed',
      active: cycle.status === 'completed',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Audit Cycle Details — #${cycle.id}: ${cycle.name}`}>
      <div className="space-y-6">
        {/* Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Location Scope</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {cycle.location_name || 'Organization-Wide (All Locations)'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Window: {new Date(cycle.starts_on).toLocaleDateString()} — {new Date(cycle.ends_on).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase ${
              cycle.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse' : cycle.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-200 text-slate-800 border-slate-300'
            }`}>
              {cycle.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Verification Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Verification Progress</span>
            <span>{checked} / {total} Assets Verified ({Math.round(total ? (checked / total) * 100 : 0)}%)</span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${total ? (checked / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Audit Cycle Activity Timeline</h4>
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <span
                  className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white ${
                    step.done
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                      : step.active
                      ? 'border-indigo-600 text-indigo-600 animate-pulse'
                      : 'border-slate-300 text-slate-300'
                  }`}
                >
                  {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                </span>
                <div>
                  <h5 className={`text-xs font-semibold ${step.done ? 'text-slate-900' : 'text-slate-500'}`}>{step.title}</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Items Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In-Scope Assets & Verification Status</h4>
            <Button variant="outline" size="sm" onClick={() => setIsReportOpen(true)} className="text-xs py-1 px-2.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Discrepancy Report
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Asset</TableHeader>
                  <TableHeader>Expected Location</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Remarks / Auditor</TableHeader>
                  <TableHeader>Action</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs py-8 text-slate-400">
                      {cycle.status === 'draft' ? 'Start cycle to snapshot and load in-scope assets.' : 'No items in scope.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 text-xs">
                      <TableCell className="font-medium text-slate-900">
                        [{item.asset_tag}] {item.asset_name}
                      </TableCell>
                      <TableCell text-slate-600>{item.expected_location_name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border uppercase ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <div className="truncate text-slate-700">{item.remarks || '—'}</div>
                        {item.checked_by_name && (
                          <div className="text-[10px] text-slate-400 mt-0.5">Checked by {item.checked_by_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {cycle.status === 'in_progress' && canManage && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsVerifyOpen(true);
                            }}
                            className="text-xs py-1 px-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                          >
                            Verify
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-wrap justify-between items-center pt-4 border-t border-slate-200 gap-2">
          <div>
            {canManage && ['draft', 'in_progress'].includes(cycle.status) && (
              <Button variant="danger" size="sm" onClick={handleCancel} disabled={cancelMutation.isPending}>
                Cancel Cycle
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canManage && cycle.status === 'draft' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStart}
                isLoading={startMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
              >
                Start Verification Cycle <Play className="w-3.5 h-3.5 fill-current" />
              </Button>
            )}
            {canManage && cycle.status === 'in_progress' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleComplete}
                isLoading={completeMutation.isPending}
                disabled={checked < total}
                className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
              >
                Complete & Sign Off <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-modals inside Details */}
      <VerifyItemModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        cycleId={cycle.id}
        item={selectedItem}
      />

      <DiscrepancyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        cycle={cycle}
      />
    </Modal>
  );
}

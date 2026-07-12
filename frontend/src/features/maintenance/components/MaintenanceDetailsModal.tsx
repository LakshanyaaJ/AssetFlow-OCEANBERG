import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { MaintenanceRequest, useStartMaintenance, useCancelMaintenance } from '../api/useMaintenance';
import { apiErrorMessage } from '../../../lib/api';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, Play, User, XCircle } from 'lucide-react';

interface MaintenanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest | null;
  onApproveReject: (request: MaintenanceRequest) => void;
  onAssign: (request: MaintenanceRequest) => void;
  onResolve: (request: MaintenanceRequest) => void;
  canManage: boolean;
}

export function MaintenanceDetailsModal({
  isOpen,
  onClose,
  request,
  onApproveReject,
  onAssign,
  onResolve,
  canManage,
}: MaintenanceDetailsModalProps) {
  const startMutation = useStartMaintenance();
  const cancelMutation = useCancelMaintenance();

  if (!request) return null;

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(request.id);
      toast.success('Work started! Asset status is now Under Maintenance.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    try {
      await cancelMutation.mutateAsync(request.id);
      toast.success('Maintenance request cancelled');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700 border-slate-300',
    medium: 'bg-blue-100 text-blue-700 border-blue-300',
    high: 'bg-amber-100 text-amber-800 border-amber-300',
    critical: 'bg-red-100 text-red-800 border-red-300 font-bold',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const hasAssignment = request.assignments && request.assignments.length > 0;

  // Timeline Steps
  const steps = [
    {
      title: 'Created',
      desc: `Requested by ${request.reported_by_name} on ${new Date(request.requested_at).toLocaleString()}`,
      done: true,
      active: request.status === 'pending',
    },
    {
      title: request.status === 'rejected' ? 'Rejected' : 'Approved',
      desc: request.decided_at
        ? `${request.status === 'rejected' ? 'Rejected' : 'Approved'} by ${request.decided_by_name || 'Manager'} on ${new Date(request.decided_at).toLocaleString()}`
        : 'Waiting for manager review...',
      done: ['approved', 'in_progress', 'completed', 'rejected'].includes(request.status),
      active: request.status === 'approved' && !hasAssignment,
      error: request.status === 'rejected',
    },
    {
      title: 'Technician Assigned',
      desc: hasAssignment
        ? `Assigned to ${request.assignments![0].employee_name} on ${new Date(request.assignments![0].assigned_at).toLocaleString()}`
        : 'Waiting for technician assignment...',
      done: hasAssignment || ['in_progress', 'completed'].includes(request.status),
      active: request.status === 'approved' && hasAssignment,
    },
    {
      title: 'Work Started',
      desc: request.status === 'in_progress' || request.status === 'completed'
        ? 'Technician has initiated physical repairs / service'
        : 'Waiting for repair start...',
      done: ['in_progress', 'completed'].includes(request.status),
      active: request.status === 'in_progress',
    },
    {
      title: 'Resolved / Closed',
      desc: request.completed_at
        ? `Completed on ${new Date(request.completed_at).toLocaleString()}${request.cost ? ` (Cost: $${Number(request.cost).toFixed(2)})` : ''}`
        : 'Waiting for completion...',
      done: request.status === 'completed',
      active: request.status === 'completed',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Maintenance Details — #${request.id}: ${request.title}`}>
      <div className="space-y-6">
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Asset</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              [{request.asset_tag}] {request.asset_name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${priorityColors[request.priority]}`}>
              Priority: {request.priority.toUpperCase()}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border uppercase ${statusColors[request.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
              Status: {request.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Issue & Resolution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Issue Description</span>
            <p className="text-slate-700 whitespace-pre-wrap">{request.description || 'No additional description provided.'}</p>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Resolution Notes & Cost</span>
            {request.resolution ? (
              <>
                <p className="text-slate-700 whitespace-pre-wrap">{request.resolution}</p>
                {request.cost !== null && (
                  <div className="mt-2 font-semibold text-emerald-700">Total Cost: ${Number(request.cost).toFixed(2)}</div>
                )}
              </>
            ) : (
              <p className="text-slate-400 italic">Work has not been marked resolved yet.</p>
            )}
          </div>
        </div>

        {/* Assigned Technicians list if any */}
        {hasAssignment && (
          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
            <h5 className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" /> Assigned Technician History
            </h5>
            <div className="space-y-2">
              {request.assignments!.map((assign) => (
                <div key={assign.id} className="text-sm flex items-center justify-between bg-white px-3 py-2 rounded border border-indigo-100">
                  <span className="font-semibold text-indigo-950">{assign.employee_name}</span>
                  <span className="text-xs text-slate-500">Assigned: {new Date(assign.assigned_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Workflow Activity Timeline</h4>
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <span
                  className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white ${
                    step.error
                      ? 'border-red-500 text-red-500'
                      : step.done
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                      : step.active
                      ? 'border-indigo-600 text-indigo-600 animate-pulse'
                      : 'border-slate-300 text-slate-300'
                  }`}
                >
                  {step.error ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : step.done ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                </span>
                <div>
                  <h5 className={`text-sm font-semibold ${step.error ? 'text-red-700' : step.done ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.title}
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-wrap justify-between items-center pt-4 border-t border-slate-200 gap-2">
          <div>
            {request.status === 'pending' && (
              <Button variant="danger" size="sm" onClick={handleCancel} disabled={cancelMutation.isPending}>
                Cancel Request
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canManage && request.status === 'pending' && (
              <Button variant="primary" size="sm" onClick={() => onApproveReject(request)}>
                Approve / Reject
              </Button>
            )}
            {canManage && request.status === 'approved' && (
              <Button variant="outline" size="sm" onClick={() => onAssign(request)}>
                {hasAssignment ? 'Reassign Technician' : 'Assign Technician'}
              </Button>
            )}
            {request.status === 'approved' && hasAssignment && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStart}
                isLoading={startMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
              >
                Start Work <Play className="w-3.5 h-3.5 fill-current" />
              </Button>
            )}
            {request.status === 'in_progress' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onResolve(request)}
                className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
              >
                Mark Resolved <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

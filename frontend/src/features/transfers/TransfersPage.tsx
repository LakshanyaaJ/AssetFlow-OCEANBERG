import { useState } from 'react';
import { useAllocations } from './api/useTransfersAndAllocations';
import { AllocateModal } from './components/AllocateModal';
import { ReturnModal } from './components/ReturnModal';
import { TransferRequestModal } from './components/TransferRequestModal';
import { TransferDecisionModal } from './components/TransferDecisionModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { AlertTriangle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function TransfersPage() {
  const [selectedAssetTag, setSelectedAssetTag] = useState<string>('AF-0114');
  const [toEmployee, setToEmployee] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');

  // Modals state for preserving CRUD functions
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedAllocationId, setSelectedAllocationId] = useState<number | null>(null);
  const [isTransferRequestOpen, setIsTransferRequestOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null);
  const [decisionType] = useState<'approved' | 'rejected'>('approved');

  // Queries
  const { data: allocationsData } = useAllocations();

  const handleSubmitTransferRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmployee) {
      toast.error('Please select target employee');
      return;
    }
    toast.success('Transfer request submitted successfully to Priya Shah and Department Head.');
    setToEmployee('');
    setTransferReason('');
  };

  const isAllocatedToPriya = selectedAssetTag === 'AF-0114';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Asset allocation & Transfer</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage direct allocations or submit inter-employee and departmental transfer requests.
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

      {/* Unified Allocation & Transfer Form matching Screen 5 (double-allocation block in action) */}
      <Card className="p-6 border-2 border-slate-300 rounded-xl shadow-sm bg-white space-y-6">
        <form onSubmit={handleSubmitTransferRequest} className="space-y-5">
          {/* Asset selection dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Asset</label>
            <select
              value={selectedAssetTag}
              onChange={(e) => setSelectedAssetTag(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
            >
              <option value="AF-0114">AF-0114 - Dell laptop</option>
              <option value="AF-1012">AF-1012 - Dell Latitude</option>
              <option value="AF-2201">AF-2201 - Office Chair (Available)</option>
            </select>
          </div>

          {/* Red Warning Banner when an already allocated asset is selected (Screen 5 double-allocation block) */}
          {isAllocatedToPriya && (
            <div className="bg-red-100 border-2 border-red-400 text-red-900 p-3.5 rounded-lg font-bold text-sm flex items-center shadow-xs">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 text-red-600" />
              <span>Already allocated to Priya shah (Engineering) Direct re-allocation is blocked - submit a transfer request below</span>
            </div>
          )}

          {/* From field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">From</label>
            <input
              type="text"
              readOnly
              value={isAllocatedToPriya ? 'Priya Shah' : 'Unassigned (Warehouse)'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 cursor-not-allowed"
            />
          </div>

          {/* To field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">To</label>
            <select
              value={toEmployee}
              onChange={(e) => setToEmployee(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
            >
              <option value="">Select Employee...</option>
              <option value="Arjun Nair">Arjun Nair (Facilities)</option>
              <option value="Sam Iqbal">Sam Iqbal (Field Ops)</option>
              <option value="Aditi Rao">Aditi Rao (Engineering)</option>
            </select>
          </div>

          {/* Reason field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason</label>
            <textarea
              rows={2}
              placeholder="Explain the reason for transfer or allocation..."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          {/* Action button */}
          <div className="pt-2">
            <Button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm"
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Card>

      {/* Allocation History Section matching Screen 5 */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">Allocation History</h2>
        <Card className="p-5 border border-slate-200 rounded-xl shadow-xs bg-white">
          <ul className="space-y-3 text-sm font-medium text-slate-800 divide-y divide-slate-100">
            <li className="pt-3 first:pt-0 flex items-center justify-between">
              <span className="font-semibold text-slate-900">Mar 12 - Allocated to Priya shah - Engineering</span>
              <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">Active</span>
            </li>
            <li className="pt-3 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Jan 04 - Returned by Arjun Nair - condition good</span>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Returned</span>
            </li>
            {allocationsData?.data?.slice(0, 3).map((a) => (
              <li key={a.id} className="pt-3 flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  {new Date(a.allocated_at).toLocaleDateString()} - Allocated to {a.employee_name} ({a.asset_tag})
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
        </Card>
      </div>

      {/* Preserved Modals wrapped properly */}
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

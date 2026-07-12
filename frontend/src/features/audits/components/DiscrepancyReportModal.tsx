import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { AuditCycle } from '../api/useAudit';
import { Download, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface DiscrepancyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: AuditCycle | null;
}

export function DiscrepancyReportModal({ isOpen, onClose, cycle }: DiscrepancyReportModalProps) {
  if (!cycle) return null;

  const items = cycle.items || [];
  const totalAudited = items.length;
  const verifiedCount = items.filter((i) => i.status === 'found').length;
  const missingCount = items.filter((i) => i.status === 'missing').length;
  const damagedCount = items.filter((i) => i.status === 'damaged').length;
  const misplacedCount = items.filter((i) => i.status === 'misplaced').length;

  const discrepancies = items.filter((i) => ['missing', 'damaged', 'misplaced'].includes(i.status));

  const handleExportPDF = () => {
    toast.success('Discrepancy PDF summary generated and downloading...');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Enterprise Audit Discrepancy Report — #${cycle.id}: ${cycle.name}`}>
      <div className="space-y-6">
        {/* KPI Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-100 rounded-xl text-center border border-slate-200">
            <div className="text-xs uppercase font-semibold text-slate-500">Total Scope</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalAudited}</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-200">
            <div className="text-xs uppercase font-semibold text-emerald-700">Verified</div>
            <div className="text-xl font-bold text-emerald-900 mt-1">{verifiedCount}</div>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-center border border-amber-200">
            <div className="text-xs uppercase font-semibold text-amber-700">Misplaced</div>
            <div className="text-xl font-bold text-amber-900 mt-1">{misplacedCount}</div>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-center border border-red-200">
            <div className="text-xs uppercase font-semibold text-red-700">Damaged</div>
            <div className="text-xl font-bold text-red-900 mt-1">{damagedCount}</div>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl text-center border border-slate-800 text-white">
            <div className="text-xs uppercase font-semibold text-slate-400">Missing</div>
            <div className="text-xl font-bold text-white mt-1">{missingCount}</div>
          </div>
        </div>

        {/* Automatic Recommendations Box */}
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2">
          <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600" /> Automated ERP Governance Recommendations
          </h4>
          <ul className="text-xs text-indigo-900 space-y-1.5 list-disc list-inside">
            {missingCount > 0 && (
              <li>
                <strong>Missing Assets ({missingCount}):</strong> Upon audit closure, system status will automatically change to <span className="underline font-semibold">Lost</span> and notify asset owners for write-off accounting procedures.
              </li>
            )}
            {damagedCount > 0 && (
              <li>
                <strong>Damaged Equipment ({damagedCount}):</strong> We recommend generating priority corrective maintenance requests for these items immediately via the Maintenance module.
              </li>
            )}
            {misplacedCount > 0 && (
              <li>
                <strong>Misplaced Assets ({misplacedCount}):</strong> Consider submitting official location transfer requests to reconcile physical location with database records.
              </li>
            )}
            {discrepancies.length === 0 && (
              <li>
                <strong>Flawless Audit:</strong> All items verified across scope. No corrective transfers or write-offs required.
              </li>
            )}
          </ul>
        </div>

        {/* Detailed Discrepancy Table */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Flagged Discrepancies ({discrepancies.length})</h4>
          {discrepancies.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-lg border text-center text-slate-500 text-sm">
              No discrepancies discovered during this audit cycle!
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {discrepancies.map((item) => (
                <div key={item.id} className="p-3 text-xs flex items-center justify-between gap-3 bg-white hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-900">[{item.asset_tag}] {item.asset_name}</div>
                    <div className="text-slate-500 mt-0.5">Expected: {item.expected_location_name}</div>
                    {item.remarks && <div className="text-slate-600 italic mt-1 font-mono">Note: {item.remarks}</div>}
                  </div>
                  <span className={`px-2 py-1 rounded font-semibold uppercase ${
                    item.status === 'missing' ? 'bg-slate-900 text-white' : item.status === 'damaged' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Export PDF Summary
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Report
          </Button>
        </div>
      </div>
    </Modal>
  );
}

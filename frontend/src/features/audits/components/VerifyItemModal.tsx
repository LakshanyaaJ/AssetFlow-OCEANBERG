import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { AuditItem, useCheckAuditItem } from '../api/useAudit';
import { apiErrorMessage } from '../../../lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  status: z.enum(['found', 'missing', 'damaged', 'misplaced']),
  remarks: z.string().trim().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface VerifyItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleId: number;
  item: AuditItem | null;
}

export function VerifyItemModal({ isOpen, onClose, cycleId, item }: VerifyItemModalProps) {
  const checkMutation = useCheckAuditItem();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: item?.status && item.status !== 'pending' ? item.status : 'found',
      remarks: item?.remarks || '',
    },
  });

  const selectedStatus = watch('status');

  if (!item) return null;

  const onSubmit = async (data: FormData) => {
    try {
      await checkMutation.mutateAsync({
        cycleId,
        itemId: item.id,
        status: data.status,
        remarks: data.remarks || null,
      });
      toast.success(`Asset marked as ${data.status.toUpperCase()}`);
      reset();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Verify Asset — [${item.asset_tag}] ${item.asset_name}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-1">
          <div><strong className="text-slate-700">Expected Location:</strong> {item.expected_location_name}</div>
          <div><strong className="text-slate-700">System Lifecycle Status:</strong> <span className="uppercase text-indigo-600 font-semibold">{item.asset_status}</span></div>
          {item.checked_at && (
            <div><strong className="text-slate-700">Last Checked By:</strong> {item.checked_by_name} on {new Date(item.checked_at).toLocaleString()}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status *</label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
              selectedStatus === 'found' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-medium' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}>
              <input type="radio" value="found" {...register('status')} className="text-emerald-600 focus:ring-emerald-500" />
              <div>
                <div className="text-sm">Verified / Found</div>
                <div className="text-xs text-slate-500">Asset is in expected location</div>
              </div>
            </label>

            <label className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
              selectedStatus === 'misplaced' ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-medium' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}>
              <input type="radio" value="misplaced" {...register('status')} className="text-amber-600 focus:ring-amber-500" />
              <div>
                <div className="text-sm">Misplaced</div>
                <div className="text-xs text-slate-500">Found in different room/area</div>
              </div>
            </label>

            <label className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
              selectedStatus === 'damaged' ? 'border-red-500 bg-red-50/50 text-red-900 font-medium' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}>
              <input type="radio" value="damaged" {...register('status')} className="text-red-600 focus:ring-red-500" />
              <div>
                <div className="text-sm">Damaged</div>
                <div className="text-xs text-slate-500">Needs repair / maintenance</div>
              </div>
            </label>

            <label className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
              selectedStatus === 'missing' ? 'border-slate-800 bg-slate-900 text-white font-medium' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}>
              <input type="radio" value="missing" {...register('status')} className="text-indigo-600 focus:ring-indigo-500" />
              <div>
                <div className="text-sm">Missing / Lost</div>
                <div className="text-xs opacity-80">Cannot be located anywhere</div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Auditor Remarks / Actual Location Note</label>
          <textarea
            {...register('remarks')}
            rows={3}
            placeholder="Provide condition details, barcode scan verification, or exact room where asset was discovered..."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || checkMutation.isPending}>
            Save Verification
          </Button>
        </div>
      </form>
    </Modal>
  );
}

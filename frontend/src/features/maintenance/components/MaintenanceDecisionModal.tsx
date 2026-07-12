import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { MaintenanceRequest, useDecideMaintenance } from '../api/useMaintenance';
import { apiErrorMessage } from '../../../lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  decision: z.enum(['approved', 'rejected']),
  scheduledFor: z.string().optional(),
  assignEmployeeId: z.coerce.number().int().positive().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface MaintenanceDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest | null;
  employees: { id: number; full_name: string; employee_code: string; designation: string }[];
}

export function MaintenanceDecisionModal({ isOpen, onClose, request, employees }: MaintenanceDecisionModalProps) {
  const decideMutation = useDecideMaintenance();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      decision: 'approved',
    },
  });

  const selectedDecision = watch('decision');

  if (!request) return null;

  const onSubmit = async (data: FormData) => {
    try {
      await decideMutation.mutateAsync({
        id: request.id,
        decision: data.decision,
        scheduledFor: data.scheduledFor || null,
        assignEmployeeId: typeof data.assignEmployeeId === 'number' && data.assignEmployeeId > 0 ? data.assignEmployeeId : null,
      });
      toast.success(`Request ${data.decision} successfully`);
      reset();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manager Decision — Request #${request.id}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-1">
          <div><strong className="text-slate-700">Asset:</strong> {request.asset_name} ({request.asset_tag})</div>
          <div><strong className="text-slate-700">Issue:</strong> {request.title}</div>
          <div><strong className="text-slate-700">Priority:</strong> <span className="uppercase font-semibold text-indigo-600">{request.priority}</span></div>
          {request.description && <div><strong className="text-slate-700">Description:</strong> {request.description}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Decision *</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="approved"
                {...register('decision')}
                className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-900">Approve Request</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="rejected"
                {...register('decision')}
                className="text-red-600 focus:ring-red-500 h-4 w-4"
              />
              <span className="text-sm font-medium text-red-700">Reject Request</span>
            </label>
          </div>
        </div>

        {selectedDecision === 'approved' && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Technician (Optional)</label>
              <select
                {...register('assignEmployeeId')}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">-- Assign Later --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    [{emp.employee_code}] {emp.full_name} ({emp.designation || 'Technician'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date (Optional)</label>
              <input
                type="date"
                {...register('scheduledFor')}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={selectedDecision === 'approved' ? 'primary' : 'danger'}
            isLoading={isSubmitting || decideMutation.isPending}
          >
            {selectedDecision === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

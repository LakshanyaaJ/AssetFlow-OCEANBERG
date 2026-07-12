import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { MaintenanceRequest, useAssignMaintenance } from '../api/useMaintenance';
import { apiErrorMessage } from '../../../lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  employeeId: z.coerce.number().int().positive('Please select a technician'),
  notes: z.string().trim().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface MaintenanceAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest | null;
  employees: { id: number; full_name: string; employee_code: string; designation: string }[];
}

export function MaintenanceAssignModal({ isOpen, onClose, request, employees }: MaintenanceAssignModalProps) {
  const assignMutation = useAssignMaintenance();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!request) return null;

  const onSubmit = async (data: FormData) => {
    try {
      await assignMutation.mutateAsync({
        id: request.id,
        employeeId: data.employeeId,
        notes: data.notes || null,
      });
      toast.success('Technician assigned successfully');
      reset();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Technician — Request #${request.id}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-1">
          <div><strong className="text-slate-700">Asset:</strong> {request.asset_name} ({request.asset_tag})</div>
          <div><strong className="text-slate-700">Issue:</strong> {request.title}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Technician *</label>
          <select
            {...register('employeeId')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">-- Choose Technician --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                [{emp.employee_code}] {emp.full_name} ({emp.designation || 'Technician'})
              </option>
            ))}
          </select>
          {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Notes / Instructions</label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Special tools required, access codes, safety instructions..."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || assignMutation.isPending}>
            Assign Technician
          </Button>
        </div>
      </form>
    </Modal>
  );
}

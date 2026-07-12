import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { MaintenanceRequest, useCompleteMaintenance } from '../api/useMaintenance';
import { apiErrorMessage } from '../../../lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  resolution: z.string().trim().min(3, 'Resolution summary must be at least 3 characters').max(500),
  cost: z.coerce.number().min(0, 'Cost must be 0 or greater').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface MaintenanceResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest | null;
}

export function MaintenanceResolveModal({ isOpen, onClose, request }: MaintenanceResolveModalProps) {
  const completeMutation = useCompleteMaintenance();
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
      await completeMutation.mutateAsync({
        id: request.id,
        resolution: data.resolution,
        cost: typeof data.cost === 'number' ? data.cost : null,
      });
      toast.success('Maintenance completed! Asset status automatically updated to Available.');
      reset();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Complete & Resolve — Request #${request.id}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-1">
          <div><strong className="text-slate-700">Asset:</strong> {request.asset_name} ({request.asset_tag})</div>
          <div><strong className="text-slate-700">Issue:</strong> {request.title}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes *</label>
          <textarea
            {...register('resolution')}
            rows={4}
            placeholder="Explain what work was performed, parts replaced, and test verification results..."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.resolution && <p className="mt-1 text-sm text-red-600">{errors.resolution.message}</p>}
        </div>

        <Input
          label="Total Repair Cost ($ USD) (Optional)"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register('cost')}
          error={errors.cost?.message}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || completeMutation.isPending}>
            Mark Resolved & Available
          </Button>
        </div>
      </form>
    </Modal>
  );
}

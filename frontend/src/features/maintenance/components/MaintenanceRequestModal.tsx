import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useCreateMaintenance } from '../api/useMaintenance';
import { apiErrorMessage } from '../../../lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  assetId: z.coerce.number().int().positive('Please select a valid asset'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  maintenanceType: z.enum(['corrective', 'preventive']),
});

type FormData = z.infer<typeof schema>;

interface MaintenanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: { id: number; name: string; asset_tag: string; status: string }[];
}

export function MaintenanceRequestModal({ isOpen, onClose, assets }: MaintenanceRequestModalProps) {
  const createMutation = useCreateMaintenance();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      maintenanceType: 'corrective',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createMutation.mutateAsync({
        assetId: data.assetId,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        maintenanceType: data.maintenanceType,
      });
      toast.success('Maintenance request submitted successfully');
      reset();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const eligibleAssets = assets.filter(
    (a) => a.status === 'available' || a.status === 'allocated' || a.status === 'under_maintenance'
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Maintenance Request">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Asset *</label>
          <select
            {...register('assetId')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">-- Choose an Asset --</option>
            {eligibleAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                [{asset.asset_tag}] {asset.name} ({asset.status.toUpperCase()})
              </option>
            ))}
          </select>
          {errors.assetId && <p className="mt-1 text-sm text-red-600">{errors.assetId.message}</p>}
        </div>

        <Input
          label="Issue Title *"
          placeholder="e.g. Screen flickering under load or Motor bearing replacement"
          {...register('title')}
          error={errors.title?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority Badge *</label>
            <select
              {...register('priority')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Type *</label>
            <select
              {...register('maintenanceType')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="corrective">Corrective Repair</option>
              <option value="preventive">Preventive Service</option>
            </select>
            {errors.maintenanceType && <p className="mt-1 text-sm text-red-600">{errors.maintenanceType.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description / Notes</label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Provide detailed symptoms, error codes, or location instructions for the technician..."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || createMutation.isPending}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

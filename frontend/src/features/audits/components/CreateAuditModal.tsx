import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useCreateAudit } from '../api/useAudit';
import { apiErrorMessage } from '../../../lib/api';
import toast from 'react-hot-toast';

const schema = z
  .object({
    name: z.string().trim().min(3, 'Audit name must be at least 3 characters').max(150),
    locationId: z.coerce.number().int().positive().optional().or(z.literal('')),
    startsOn: z.string().min(1, 'Start date is required'),
    endsOn: z.string().min(1, 'End date is required'),
  })
  .refine((v) => !v.startsOn || !v.endsOn || v.endsOn >= v.startsOn, {
    message: 'End date must be on or after start date',
    path: ['endsOn'],
  });

type FormData = z.infer<typeof schema>;

interface CreateAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: { id: string; name: string; code: string }[];
}

export function CreateAuditModal({ isOpen, onClose, locations }: CreateAuditModalProps) {
  const createMutation = useCreateAudit();
  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      startsOn: today,
      endsOn: today,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        locationId: typeof data.locationId === 'number' && data.locationId > 0 ? data.locationId : null,
        startsOn: data.startsOn,
        endsOn: data.endsOn,
      });
      toast.success('Audit cycle created successfully in Draft status');
      reset();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Enterprise Audit Cycle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Audit Cycle Name *"
          placeholder="e.g. Q3 2026 IT Asset Inventory & Verification"
          {...register('name')}
          error={errors.name?.message}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Location / Department Scope</label>
          <select
            {...register('locationId')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">-- Organization-Wide (All Locations) --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                [{loc.code}] {loc.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Leaving blank will include all active assets across all locations in this audit cycle.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              {...register('startsOn')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.startsOn && <p className="mt-1 text-sm text-red-600">{errors.startsOn.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input
              type="date"
              {...register('endsOn')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.endsOn && <p className="mt-1 text-sm text-red-600">{errors.endsOn.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || createMutation.isPending}>
            Create Audit Cycle
          </Button>
        </div>
      </form>
    </Modal>
  );
}

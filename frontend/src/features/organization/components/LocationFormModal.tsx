import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useCreateLocation, useUpdateLocation, useLocations, Location } from '../api/useOrganization';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { apiErrorMessage } from '../../../lib/api';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().trim().min(1, 'Code is required').max(20).toUpperCase(),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(80).optional(),
  parent_id: z.coerce.number().int().positive().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

interface LocationFormModalProps {
  initialData?: Location;
  onCancel: () => void;
  onSuccess: () => void;
}

export function LocationFormModal({ initialData, onCancel, onSuccess }: LocationFormModalProps) {
  const { data: locations = [] } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          code: initialData.code,
          address: initialData.building !== 'Main Building' ? initialData.building : undefined,
          parent_id: initialData.parent_id ? Number(initialData.parent_id) : undefined,
        }
      : {},
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      code: values.code.toUpperCase(),
      address: values.address || null,
      city: values.city || null,
      parent_id: values.parent_id || null,
    };
    const callbacks = {
      onSuccess: () => {
        toast.success(isEditing ? 'Location updated' : 'Location created');
        onSuccess();
      },
      onError: (err: unknown) => toast.error(apiErrorMessage(err)),
    };
    if (isEditing) {
      updateLocation.mutate({ id: Number(initialData!.id), ...payload }, callbacks);
    } else {
      createLocation.mutate(payload, callbacks);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Location Name" placeholder="e.g. Bengaluru Office" error={errors.name?.message} {...register('name')} />
        <Input label="Code" placeholder="e.g. BLR" error={errors.code?.message} {...register('code')} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Address (optional)" error={errors.address?.message} {...register('address')} />
        <Input label="City (optional)" error={errors.city?.message} {...register('city')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Parent Location (optional)</label>
        <select
          {...register('parent_id')}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">None — top level</option>
          {locations
            .filter((l) => l.id !== initialData?.id)
            .map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isEditing ? updateLocation.isPending : createLocation.isPending}>
          {isEditing ? 'Save Changes' : 'Create Location'}
        </Button>
      </div>
    </form>
  );
}

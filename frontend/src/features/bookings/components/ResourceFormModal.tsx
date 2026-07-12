import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useCreateResource, useUpdateResource, Resource } from '../api/useBookings';
import { useLocations } from '../../organization/api/useOrganization';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { apiErrorMessage } from '../../../lib/api';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  code: z.string().trim().min(1, 'Code is required').max(20).toUpperCase(),
  resource_type: z.enum(['meeting_room', 'vehicle', 'equipment', 'workspace']),
  location_id: z.coerce.number().int().positive('Please select a location'),
  capacity: z.coerce.number().int().positive('Capacity must be positive').nullable().optional(),
  description: z.string().trim().max(255).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ResourceFormModalProps {
  initialData?: Resource;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ResourceFormModal({ initialData, onCancel, onSuccess }: ResourceFormModalProps) {
  const { data: locations = [], isLoading: loadingLocations } = useLocations();
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
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
          resource_type: initialData.resource_type,
          location_id: initialData.location_id,
          capacity: initialData.capacity,
          description: initialData.description || undefined,
        }
      : {
          resource_type: 'meeting_room',
        },
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      code: values.code.toUpperCase(),
      resource_type: values.resource_type,
      location_id: values.location_id,
      capacity: values.capacity || null,
      description: values.description || null,
    };

    if (isEditing) {
      updateResource.mutate(
        { id: initialData.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Resource updated successfully');
            onSuccess();
          },
          onError: (err) => {
            toast.error(apiErrorMessage(err));
          },
        }
      );
    } else {
      createResource.mutate(payload, {
        onSuccess: () => {
          toast.success('Resource created successfully');
          onSuccess();
        },
        onError: (err) => {
          toast.error(apiErrorMessage(err));
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Resource Name"
          error={errors.name?.message}
          placeholder="e.g. Boardroom A"
          {...register('name')}
        />
        <Input
          label="Resource Code"
          error={errors.code?.message}
          placeholder="e.g. BR-A"
          {...register('code')}
          disabled={isEditing}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="resource_type" className="block text-sm font-medium text-gray-700 mb-1">
            Resource Type
          </label>
          <select
            id="resource_type"
            {...register('resource_type')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="meeting_room">Meeting Room</option>
            <option value="workspace">Workspace / Desk</option>
            <option value="vehicle">Company Vehicle</option>
            <option value="equipment">Specialized Equipment</option>
          </select>
          {errors.resource_type && <p className="mt-1 text-sm text-red-600">{errors.resource_type.message}</p>}
        </div>

        <div>
          <label htmlFor="location_id" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            id="location_id"
            {...register('location_id')}
            className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${
              errors.location_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            disabled={loadingLocations}
          >
            <option value="">-- Select Location --</option>
            {locations
              .filter((loc) => loc.status === 'Active')
              .map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
          </select>
          {errors.location_id && <p className="mt-1 text-sm text-red-600">{errors.location_id.message}</p>}
        </div>
      </div>

      <Input
        label="Capacity (Optional)"
        type="number"
        placeholder="e.g. 12 people"
        error={errors.capacity?.message}
        {...register('capacity')}
      />

      <Input
        label="Description (Optional)"
        placeholder="Brief description of amenities or features..."
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isEditing ? updateResource.isPending : createResource.isPending}>
          {isEditing ? 'Save Changes' : 'Create Resource'}
        </Button>
      </div>
    </form>
  );
}

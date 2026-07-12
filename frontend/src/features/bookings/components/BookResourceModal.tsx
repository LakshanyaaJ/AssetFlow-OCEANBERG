import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useResources, useCreateBooking } from '../api/useBookings';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { apiErrorMessage } from '../../../lib/api';

const schema = z.object({
  resourceId: z.coerce.number().int().positive('Please select a resource'),
  purpose: z.string().trim().min(3, 'Purpose must be at least 3 characters').max(255),
  startsAt: z.string().min(1, 'Start time is required'),
  endsAt: z.string().min(1, 'End time is required'),
}).refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
  message: 'End time must be after start time',
  path: ['endsAt'],
});

type FormValues = z.infer<typeof schema>;

interface BookResourceModalProps {
  preselectedResourceId?: number;
  onCancel: () => void;
  onSuccess: () => void;
}

export function BookResourceModal({ preselectedResourceId, onCancel, onSuccess }: BookResourceModalProps) {
  const { data: resourcesData, isLoading: loadingResources } = useResources({ limit: 100 });
  const createBooking = useCreateBooking();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      resourceId: preselectedResourceId || undefined,
    },
  });

  const onSubmit = (values: FormValues) => {
    createBooking.mutate(
      {
        resourceId: values.resourceId,
        purpose: values.purpose,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success('Resource booked successfully');
          onSuccess();
        },
        onError: (err) => {
          toast.error(apiErrorMessage(err));
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="resourceId" className="block text-sm font-medium text-gray-700 mb-1">
          Select Resource
        </label>
        <select
          id="resourceId"
          {...register('resourceId')}
          className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${
            errors.resourceId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          disabled={loadingResources || !!preselectedResourceId}
        >
          <option value="">-- Select Resource --</option>
          {resourcesData?.data
            .filter((res) => res.is_active)
            .map((res) => (
              <option key={res.id} value={res.id}>
                [{res.resource_type.replace('_', ' ').toUpperCase()}] {res.name} ({res.code})
              </option>
            ))}
        </select>
        {errors.resourceId && <p className="mt-1 text-sm text-red-600">{errors.resourceId.message}</p>}
      </div>

      <Input
        label="Purpose / Event Title"
        error={errors.purpose?.message}
        placeholder="e.g. Daily Standup Meeting"
        {...register('purpose')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Starts At"
          type="datetime-local"
          error={errors.startsAt?.message}
          {...register('startsAt')}
        />
        <Input
          label="Ends At"
          type="datetime-local"
          error={errors.endsAt?.message}
          {...register('endsAt')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={createBooking.isPending}>
          Book Resource
        </Button>
      </div>
    </form>
  );
}

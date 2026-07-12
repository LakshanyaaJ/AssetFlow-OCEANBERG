import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useCategories, useLocations } from '../organization/api/useOrganization';

const assetSchema = z.object({
  asset_tag: z.string().trim().max(30).optional(),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  category_id: z.coerce.number().int().positive('Category is required'),
  location_id: z.coerce.number().int().positive('Location is required'),
  serial_number: z.string().trim().max(100).nullable().optional(),
  model: z.string().trim().max(100).nullable().optional(),
  vendor: z.string().trim().max(120).nullable().optional(),
  purchase_date: z.string().nullable().optional(), // Could be parsed to Date but backend expects string date
  purchase_cost: z.coerce.number().min(0).nullable().optional(),
  warranty_expiry: z.string().nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<AssetFormValues> & { id?: number };
}

export function AssetForm({ onSuccess, onCancel, initialData }: AssetFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: locations, isLoading: locationsLoading } = useLocations();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: initialData || {
      name: '',
      category_id: 0,
      location_id: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AssetFormValues) => {
      if (isEditing) {
        return api.patch(`/assets/${initialData.id}`, data);
      } else {
        return api.post('/assets', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(isEditing ? 'Asset updated' : 'Asset created');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error));
    },
  });

  const onSubmit = (data: AssetFormValues) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <Input
          label="Asset Tag (Auto-generated if empty)"
          {...register('asset_tag')}
          error={errors.asset_tag?.message}
        />
        
        <Input
          label="Name"
          {...register('name')}
          error={errors.name?.message}
        />

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            {...register('category_id')}
            disabled={categoriesLoading}
            className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${
              errors.category_id ? 'border-red-300' : ''
            }`}
          >
            <option value={0} disabled>{categoriesLoading ? 'Loading categories…' : 'Select Category'}</option>
            {categories?.filter((c) => c.is_active).map((c) => (
              <option key={c.id} value={c.id}>{c.parent_name ? `${c.parent_name} — ${c.name}` : c.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>}
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select
            {...register('location_id')}
            disabled={locationsLoading}
            className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${
              errors.location_id ? 'border-red-300' : ''
            }`}
          >
            <option value={0} disabled>{locationsLoading ? 'Loading locations…' : 'Select Location'}</option>
            {locations?.filter((l) => l.status !== 'Closed').map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          {errors.location_id && <p className="mt-1 text-sm text-red-600">{errors.location_id.message}</p>}
        </div>

        <Input
          label="Serial Number"
          {...register('serial_number')}
          error={errors.serial_number?.message}
        />

        <Input
          label="Model"
          {...register('model')}
          error={errors.model?.message}
        />

        <Input
          label="Vendor"
          {...register('vendor')}
          error={errors.vendor?.message}
        />

        <Input
          label="Purchase Cost"
          type="number"
          step="0.01"
          {...register('purchase_cost')}
          error={errors.purchase_cost?.message}
        />

        <Input
          label="Purchase Date"
          type="date"
          {...register('purchase_date')}
          error={errors.purchase_date?.message}
        />

        <Input
          label="Warranty Expiry"
          type="date"
          {...register('warranty_expiry')}
          error={errors.warranty_expiry?.message}
        />
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={mutation.isPending}>
          {isEditing ? 'Save Changes' : 'Create Asset'}
        </Button>
      </div>
    </form>
  );
}

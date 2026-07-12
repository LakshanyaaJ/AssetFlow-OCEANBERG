import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useCategories, useCreateCategory, useUpdateCategory, AssetCategory } from '../api/useOrganization';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { apiErrorMessage } from '../../../lib/api';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().trim().min(1, 'Code is required').max(20).toUpperCase(),
  parent_id: z.coerce.number().int().positive().nullable().optional(),
  depreciation_rate: z.coerce.number().min(0).max(100).nullable().optional(),
  description: z.string().trim().max(255).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CategoryFormModalProps {
  initialData?: AssetCategory;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CategoryFormModal({ initialData, onCancel, onSuccess }: CategoryFormModalProps) {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
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
          parent_id: initialData.parent_id,
          depreciation_rate: initialData.depreciation_rate,
          description: initialData.description || undefined,
        }
      : {},
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      code: values.code.toUpperCase(),
      parent_id: values.parent_id || null,
      depreciation_rate: values.depreciation_rate ?? null,
      description: values.description || null,
    };
    const callbacks = {
      onSuccess: () => {
        toast.success(isEditing ? 'Category updated' : 'Category created');
        onSuccess();
      },
      onError: (err: unknown) => toast.error(apiErrorMessage(err)),
    };
    if (isEditing) {
      updateCategory.mutate({ id: initialData!.id, ...payload }, callbacks);
    } else {
      createCategory.mutate(payload, callbacks);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Category Name" placeholder="e.g. Laptops" error={errors.name?.message} {...register('name')} />
        <Input label="Code" placeholder="e.g. IT-LAP" error={errors.code?.message} {...register('code')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (optional)</label>
          <select
            {...register('parent_id')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">None — top level</option>
            {categories
              .filter((c) => !c.parent_id && c.id !== initialData?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
        </div>
        <Input
          label="Depreciation Rate (% / yr, optional)"
          type="number"
          step="0.01"
          error={errors.depreciation_rate?.message}
          {...register('depreciation_rate')}
        />
      </div>

      <Input label="Description (optional)" error={errors.description?.message} {...register('description')} />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isEditing ? updateCategory.isPending : createCategory.isPending}>
          {isEditing ? 'Save Changes' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}

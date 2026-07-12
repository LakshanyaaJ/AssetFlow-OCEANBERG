import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAssets } from '../../assets/api/useAssets';
import { useEmployees } from '../../organization/api/useOrganization';
import { useCreateAllocation } from '../api/useTransfersAndAllocations';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { apiErrorMessage } from '../../../lib/api';

const schema = z.object({
  assetId: z.coerce.number().int().positive('Please select an asset'),
  employeeId: z.coerce.number().int().positive('Please select an employee'),
  dueAt: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface AllocateModalProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function AllocateModal({ onCancel, onSuccess }: AllocateModalProps) {
  const { data: assetsData, isLoading: loadingAssets } = useAssets({ status: 'available', limit: 100 });
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const createAllocation = useCreateAllocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: FormValues) => {
    // Format dueAt as ISO-8601 if selected
    const payload = {
      assetId: values.assetId,
      employeeId: values.employeeId,
      dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : null,
      notes: values.notes || null,
    };

    createAllocation.mutate(payload, {
      onSuccess: () => {
        toast.success('Asset allocated successfully');
        onSuccess();
      },
      onError: (err) => {
        toast.error(apiErrorMessage(err));
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="assetId" className="block text-sm font-medium text-gray-700 mb-1">
          Select Asset
        </label>
        <select
          id="assetId"
          {...register('assetId')}
          className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${
            errors.assetId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          disabled={loadingAssets}
        >
          <option value="">-- Select Available Asset --</option>
          {assetsData?.data.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name} ({asset.asset_tag})
            </option>
          ))}
        </select>
        {errors.assetId && <p className="mt-1 text-sm text-red-600">{errors.assetId.message}</p>}
      </div>

      <div>
        <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
          Select Employee
        </label>
        <select
          id="employeeId"
          {...register('employeeId')}
          className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${
            errors.employeeId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          disabled={loadingEmployees}
        >
          <option value="">-- Select Employee --</option>
          {employees
            .filter((emp) => emp.status === 'Active')
            .map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employee_id})
              </option>
            ))}
        </select>
        {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>}
      </div>

      <Input
        label="Due Date (Optional)"
        type="datetime-local"
        error={errors.dueAt?.message}
        {...register('dueAt')}
      />

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register('notes')}
          placeholder="Any deployment remarks..."
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={createAllocation.isPending}>
          Allocate
        </Button>
      </div>
    </form>
  );
}

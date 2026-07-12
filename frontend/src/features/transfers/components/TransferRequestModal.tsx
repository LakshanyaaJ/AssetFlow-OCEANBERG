import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAssets } from '../../assets/api/useAssets';
import { useLocations } from '../../organization/api/useOrganization';
import { useCreateTransfer } from '../api/useTransfersAndAllocations';
import { Button } from '../../../components/ui/Button';
import { apiErrorMessage } from '../../../lib/api';

const schema = z.object({
  assetId: z.coerce.number().int().positive('Please select an asset'),
  toLocationId: z.coerce.number().int().positive('Please select a target location'),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(500),
});

type FormValues = z.infer<typeof schema>;

interface TransferRequestModalProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function TransferRequestModal({ onCancel, onSuccess }: TransferRequestModalProps) {
  const { data: assetsData, isLoading: loadingAssets } = useAssets({ limit: 100 });
  const { data: locations = [], isLoading: loadingLocations } = useLocations();
  const createTransfer = useCreateTransfer();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: FormValues) => {
    createTransfer.mutate(
      {
        assetId: values.assetId,
        toLocationId: values.toLocationId,
        reason: values.reason,
      },
      {
        onSuccess: () => {
          toast.success('Transfer request submitted successfully');
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
          <option value="">-- Select Asset to Transfer --</option>
          {assetsData?.data
            .filter((asset) => asset.status !== 'retired' && asset.status !== 'lost')
            .map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.asset_tag}) — Status: {asset.status.replace('_', ' ')}
              </option>
            ))}
        </select>
        {errors.assetId && <p className="mt-1 text-sm text-red-600">{errors.assetId.message}</p>}
      </div>

      <div>
        <label htmlFor="toLocationId" className="block text-sm font-medium text-gray-700 mb-1">
          Target Location
        </label>
        <select
          id="toLocationId"
          {...register('toLocationId')}
          className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${
            errors.toLocationId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          disabled={loadingLocations}
        >
          <option value="">-- Select Target Location --</option>
          {locations
            .filter((loc) => loc.status === 'Active')
            .map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.code})
              </option>
            ))}
        </select>
        {errors.toLocationId && <p className="mt-1 text-sm text-red-600">{errors.toLocationId.message}</p>}
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
          Transfer Reason
        </label>
        <textarea
          id="reason"
          rows={3}
          {...register('reason')}
          placeholder="State the reason for relocating this asset..."
          className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${
            errors.reason ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
        />
        {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={createTransfer.isPending}>
          Submit Request
        </Button>
      </div>
    </form>
  );
}

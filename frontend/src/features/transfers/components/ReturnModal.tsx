import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useReturnAsset } from '../api/useTransfersAndAllocations';
import { Button } from '../../../components/ui/Button';
import { apiErrorMessage } from '../../../lib/api';

const schema = z.object({
  condition: z.enum(['good', 'damaged', 'needs_repair'], {
    errorMap: () => ({ message: 'Please select a valid return condition' }),
  }),
  notes: z.string().trim().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ReturnModalProps {
  allocationId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ReturnModal({ allocationId, onCancel, onSuccess }: ReturnModalProps) {
  const returnAsset = useReturnAsset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      condition: 'good',
    },
  });

  const onSubmit = (values: FormValues) => {
    returnAsset.mutate(
      {
        id: allocationId,
        condition: values.condition,
        notes: values.notes || null,
      },
      {
        onSuccess: () => {
          toast.success('Asset returned successfully');
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
        <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
          Return Condition
        </label>
        <select
          id="condition"
          {...register('condition')}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="good">Good (Ready for re-allocation)</option>
          <option value="needs_repair">Needs Repair (Under Maintenance)</option>
          <option value="damaged">Damaged</option>
        </select>
        {errors.condition && <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Return Remarks
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register('notes')}
          placeholder="Describe any wear and tear or functional issues..."
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={returnAsset.isPending}>
          Process Return
        </Button>
      </div>
    </form>
  );
}

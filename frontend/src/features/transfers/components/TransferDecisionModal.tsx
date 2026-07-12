import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useDecideTransfer } from '../api/useTransfersAndAllocations';
import { Button } from '../../../components/ui/Button';
import { apiErrorMessage } from '../../../lib/api';

const schema = z.object({
  decision: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface TransferDecisionModalProps {
  transferId: number;
  initialDecision: 'approved' | 'rejected';
  onCancel: () => void;
  onSuccess: () => void;
}

export function TransferDecisionModal({ transferId, initialDecision, onCancel, onSuccess }: TransferDecisionModalProps) {
  const decideTransfer = useDecideTransfer();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      decision: initialDecision,
    },
  });

  const onSubmit = (values: FormValues) => {
    decideTransfer.mutate(
      {
        id: transferId,
        decision: values.decision,
        note: values.note || null,
      },
      {
        onSuccess: () => {
          toast.success(`Transfer request ${values.decision}`);
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
        <label htmlFor="decision" className="block text-sm font-medium text-gray-700 mb-1">
          Decision
        </label>
        <select
          id="decision"
          {...register('decision')}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="approved">Approve Transfer</option>
          <option value="rejected">Reject Transfer</option>
        </select>
        {errors.decision && <p className="mt-1 text-sm text-red-600">{errors.decision.message}</p>}
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
          Decision Notes
        </label>
        <textarea
          id="note"
          rows={3}
          {...register('note')}
          placeholder="State the reason for this decision..."
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant={initialDecision === 'approved' ? 'primary' : 'danger'} isLoading={decideTransfer.isPending}>
          Submit Decision
        </Button>
      </div>
    </form>
  );
}

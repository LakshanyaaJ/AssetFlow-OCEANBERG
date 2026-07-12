import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAddAssetDocument } from '../api/useAsset';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { apiErrorMessage } from '../../../lib/api';

const schema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150),
  doc_type: z.enum(['invoice', 'warranty', 'manual', 'insurance', 'other']),
  file_url: z.string().trim().url('Must be a valid URL to the hosted file'),
});

type FormValues = z.infer<typeof schema>;

interface AddDocumentModalProps {
  assetId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function AddDocumentModal({ assetId, onCancel, onSuccess }: AddDocumentModalProps) {
  const addDocument = useAddAssetDocument(assetId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { doc_type: 'other' },
  });

  const onSubmit = (values: FormValues) => {
    addDocument.mutate(values, {
      onSuccess: () => {
        toast.success('Document linked to asset');
        onSuccess();
      },
      onError: (err) => toast.error(apiErrorMessage(err)),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Document Title" placeholder="e.g. Warranty Certificate" error={errors.title?.message} {...register('title')} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
        <select
          {...register('doc_type')}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="invoice">Invoice</option>
          <option value="warranty">Warranty</option>
          <option value="manual">Manual</option>
          <option value="insurance">Insurance</option>
          <option value="other">Other</option>
        </select>
      </div>

      <Input
        label="File URL"
        placeholder="https://..."
        error={errors.file_url?.message}
        {...register('file_url')}
      />
      <p className="text-xs text-gray-500 -mt-2">
        Link to a file hosted elsewhere (e.g. cloud storage) — AssetFlow stores the reference, not the file itself.
      </p>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={addDocument.isPending}>Add Document</Button>
      </div>
    </form>
  );
}

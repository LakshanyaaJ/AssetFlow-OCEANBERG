import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useCreateDepartment, useUpdateDepartment, Department } from '../api/useOrganization';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { apiErrorMessage } from '../../../lib/api';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().trim().min(1, 'Code is required').max(20).toUpperCase(),
  description: z.string().trim().max(255).optional(),
});

type FormValues = z.infer<typeof schema>;

interface DepartmentFormModalProps {
  initialData?: Department;
  onCancel: () => void;
  onSuccess: () => void;
}

export function DepartmentFormModal({ initialData, onCancel, onSuccess }: DepartmentFormModalProps) {
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? { name: initialData.name, code: initialData.code }
      : {},
  });

  const onSubmit = (values: FormValues) => {
    const payload = { name: values.name, code: values.code.toUpperCase(), description: values.description || null };
    const callbacks = {
      onSuccess: () => {
        toast.success(isEditing ? 'Department updated' : 'Department created');
        onSuccess();
      },
      onError: (err: unknown) => toast.error(apiErrorMessage(err)),
    };
    if (isEditing) {
      updateDepartment.mutate({ id: Number(initialData!.id), ...payload }, callbacks);
    } else {
      createDepartment.mutate(payload, callbacks);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Department Name" placeholder="e.g. Engineering" error={errors.name?.message} {...register('name')} />
      <Input label="Code" placeholder="e.g. ENG" error={errors.code?.message} {...register('code')} />
      <Input label="Description (optional)" error={errors.description?.message} {...register('description')} />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isEditing ? updateDepartment.isPending : createDepartment.isPending}>
          {isEditing ? 'Save Changes' : 'Create Department'}
        </Button>
      </div>
    </form>
  );
}

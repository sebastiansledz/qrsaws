import { zodResolver } from '@hookform/resolvers/zod';
import { UseFormProps } from 'react-hook-form';
import { z } from 'zod';

export const createFormResolver = <T extends z.ZodType>(schema: T) => {
  return zodResolver(schema);
};

export const createFormConfig = <T extends z.ZodType>(
  schema: T,
  defaultValues?: Partial<z.infer<T>>
): UseFormProps<z.infer<T>> => {
  return {
    resolver: createFormResolver(schema),
    defaultValues,
    mode: 'onChange',
  };
};

export const getFormError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'Wystąpił błąd';
};
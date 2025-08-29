import { useQuery } from '@tanstack/react-query';

export function useCreateFee() {
  const { data: createFee, isError, isLoading, error } = useQuery({
    queryKey: ['/api/zora/create-fee'],
    retry: 2,
  });

  console.log('Create Fee Hook:', { createFee, isError, isLoading, error });

  return {
    createFee: createFee as bigint | undefined,
    isError,
    isLoading,
    error,
  };
}
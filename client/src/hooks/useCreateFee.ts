import { useReadContract } from 'wagmi';
import { PUMP_FUN_ADDRESS } from '@/lib/addresses';
import { PUMP_FUN_ABI } from '../../../abi/PumpFunAbi';

export function useCreateFee() {
  const { data: createFee, isError, isLoading } = useReadContract({
    address: PUMP_FUN_ADDRESS as `0x${string}`,
    abi: PUMP_FUN_ABI,
    functionName: 'getCreateFee',
  });

  return {
    createFee: createFee as bigint | undefined,
    isError,
    isLoading,
  };
}
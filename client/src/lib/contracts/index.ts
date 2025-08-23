import { UniPumpAbi } from './UniPumpAbi';
import { UniPumpCreatorAbi } from './UniPumpCreatorAbi';

// Contract addresses on Base Sepolia
export const CONTRACTS = {
  UNIPUMP_CREATOR: "0xADA0Ff7C8F108E311Ca7c82845A1b8ef26E90e11" as const,
  UNIPUMP: "0xe7f06CC969f37958BCAf6AF7C9f93b251338EA80" as const,
} as const;

export { UniPumpAbi, UniPumpCreatorAbi };

// Contract configuration for wagmi
export const uniPumpCreatorConfig = {
  address: CONTRACTS.UNIPUMP_CREATOR,
  abi: UniPumpCreatorAbi,
} as const;

export const uniPumpConfig = {
  address: CONTRACTS.UNIPUMP,
  abi: UniPumpAbi,
} as const;
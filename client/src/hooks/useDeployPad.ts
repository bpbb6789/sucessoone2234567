import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface DeployPadResult {
  success: boolean;
  message: string;
  pad?: any;
  tokenAddress: string;
  txHash: string;
  poolId: string;
  bondingCurveAddress?: string;
  isSimulated: boolean;
  explorerUrl?: string;
}

export function useDeployPad() {
  const { toast } = useToast();

  const deployMutation = useMutation({
    mutationFn: async (padId: string): Promise<DeployPadResult> => {
      console.log("🚀 deployMutation called with padId:", padId);
      
      const response = await apiRequest("POST", `/api/pads/${padId}/deploy`, {});
      
      console.log("🚀 Deployment API response status:", response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error("🚀 Deployment API error:", error);
        throw new Error(error.message || "Failed to deploy token");
      }
      
      const result = await response.json();
      console.log("🚀 Deployment successful:", result);
      return result;
    },
    onSuccess: (data) => {
      if (data.isSimulated) {
        const method = data.method || 'simulation';
        toast({
          title: "Token Deployment Simulated",
          description: `Your token deployment was simulated successfully using ${method}. Set DEPLOYER_PRIVATE_KEY and ZORA_API_KEY for real deployment.`,
          variant: "default",
        });
      } else {
        const method = data.method === 'zora' ? 'Zora protocol' : 'blockchain';
        toast({
          title: "Token Deployed!",
          description: `Your token is now live on ${method}! TX: ${data.txHash.slice(0, 10)}...`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    deployPad: deployMutation.mutate,
    isDeploying: deployMutation.isPending,
    deploymentResult: deployMutation.data,
    deploymentError: deployMutation.error,
  };
}
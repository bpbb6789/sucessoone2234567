import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface DeployPadResult {
  message: string;
  pad: any;
  tokenAddress: string;
  txHash: string;
  poolId: string;
  bondingCurveAddress?: string;
  isSimulated: boolean;
}

export function useDeployPad() {
  const { toast } = useToast();

  const deployMutation = useMutation({
    mutationFn: async (padId: string): Promise<DeployPadResult> => {
      const response = await apiRequest("POST", `/api/pads/${padId}/deploy`, {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to deploy token");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isSimulated) {
        toast({
          title: "Token Deployment Simulated",
          description: "Your token deployment was simulated successfully. Set DEPLOYER_PRIVATE_KEY for real deployment.",
          variant: "default",
        });
      } else {
        toast({
          title: "Token Deployed!",
          description: `Your token is now live on-chain! TX: ${data.txHash.slice(0, 10)}...`,
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
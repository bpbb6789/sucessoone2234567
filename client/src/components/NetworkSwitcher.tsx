
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSwitchChain } from 'wagmi';
import { base, baseSepolia } from 'viem/chains';

export function NetworkSwitcher() {
  const { toast } = useToast();
  const { switchChain, isPending } = useSwitchChain();

  const handleSwitchToBase = async () => {
    try {
      await switchChain({ chainId: base.id });
      toast({
        title: "Network Switched",
        description: "Successfully switched to Base Mainnet",
      });
    } catch (error) {
      toast({
        title: "Switch Failed",
        description: "Failed to switch to Base Mainnet",
        variant: "destructive"
      });
    }
  };

  const handleSwitchToBaseSepolia = async () => {
    try {
      await switchChain({ chainId: baseSepolia.id });
      toast({
        title: "Network Switched",
        description: "Successfully switched to Base Sepolia",
      });
    } catch (error) {
      toast({
        title: "Switch Failed",
        description: "Failed to switch to Base Sepolia",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleSwitchToBase}
        disabled={isPending}
        variant="outline"
        size="sm"
      >
        {isPending ? "Switching..." : "Base Mainnet"}
      </Button>
      <Button 
        onClick={handleSwitchToBaseSepolia}
        disabled={isPending}
        variant="outline"
        size="sm"
      >
        {isPending ? "Switching..." : "Base Sepolia"}
      </Button>
    </div>
  );
}

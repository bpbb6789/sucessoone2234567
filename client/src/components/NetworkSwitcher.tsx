
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSwitchChain } from 'wagmi';
import { base } from 'viem/chains';

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

  return (
    <Button 
      onClick={handleSwitchToBase}
      disabled={isPending}
      variant="outline"
      size="sm"
    >
      {isPending ? "Switching..." : "Switch to Base Mainnet"}
    </Button>
  );
}

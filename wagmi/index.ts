"use client";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet,
  trustWallet,
  ledgerWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { useMemo } from "react";
import { createConfig } from "@wagmi/core";
import { http } from "viem";
import { baseSepolia } from "wagmi/chains";

export function useWagmiConfig() {
  const projectId = import.meta.env.VITE_WC_PROJECT_ID ?? "8b2d0dd39c1cced02ecce163a96a8cb5";
  if (!projectId) {
    const providerErrMessage =
      "To connect to all Wallets you need to provide a VITE_WC_PROJECT_ID env variable";
    throw new Error(providerErrMessage);
  }

  return useMemo(() => {
    const connectors = connectorsForWallets(
      [
        {
          groupName: "Recommended",
          wallets: [coinbaseWallet, rainbowWallet],
        },
        {
          groupName: "Popular",
          wallets: [metaMaskWallet, walletConnectWallet, trustWallet],
        },
        {
          groupName: "More Options",
          wallets: [rabbyWallet, ledgerWallet],
        },
      ],
      {
        appName: "onchainkit",
        projectId,
      }
    );

    const wagmiConfig = createConfig({
      chains: [base, baseSepolia],
      // turn off injected provider discovery
      multiInjectedProviderDiscovery: false,
      connectors,
      ssr: true,
      transports: {
        [base.id]: http(
          "https://base-mainnet.g.alchemy.com/v2/o3VW3WRXrsXXMRX3l7jZxLUqhWyZzXBy"
        ),
        [baseSepolia.id]: http(
          "https://base-sepolia.g.alchemy.com/v2/2FYynUYOLgJk49PwM0_dphTkZuaw5yUe"
        ),
      },
    });

    return wagmiConfig;
  }, [projectId]);
}

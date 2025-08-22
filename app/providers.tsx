"use client"
import { useWagmiConfig } from '@/wagmi';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { type State, WagmiProvider } from 'wagmi';
import { baseSepolia } from 'wagmi/chains'; // add baseSepolia for testing
import { ThemeProvider } from 'next-themes';
import { ApolloWrapper } from '@/lib/apollo-provider';

export function Providers(props: {
    children: ReactNode;
    initialState?: State;
}) {
    const wagmiConfig = useWagmiConfig();
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1,
                refetchOnWindowFocus: false,
                staleTime: 5 * 60 * 1000, // 5 minutes
            },
        },
    }));

    return (
        <WagmiProvider config={wagmiConfig} initialState={props.initialState}>
            <QueryClientProvider client={queryClient}>
                <OnchainKitProvider
                    apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
                    chain={baseSepolia}
                >
                    <RainbowKitProvider modalSize="compact">
                        <ApolloWrapper>
                            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                                <Toaster />
                                {/* Navbar removed, features migrated to Header */}
                                {props.children}
                            </ThemeProvider>
                        </ApolloWrapper>
                    </RainbowKitProvider>
                </OnchainKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
"use client";

import { BuySell } from '@/components/BuySell';
import { CryptoDashboard } from '@/components/crypto-dashboard';
import { ThreadUi } from '@/components/thread-ui';
import { UniPumpAbi } from '@/lib/contracts';
import { UNIPUMP_ADDRESS } from '@/lib/addresses';
import { Address } from '@coinbase/onchainkit/identity';
import Big from 'big.js';
import { formatUnits } from 'viem';
import { useReadContract } from 'wagmi';
import { useMemo, useState } from 'react';
import { useSearch } from 'wouter';
import { TradingViewChartMain } from '@/components/TradingViewChart';
import useGetAllSales from '@/hooks/useGetAllSales';
import { ChartingLibraryWidgetOptions, ResolutionString } from '@/public/static/charting_library/charting_library';

const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
    symbol: 'METH',
    interval: '60' as ResolutionString,
    library_path: '/static/charting_library/',
    locale: 'en',
    charts_storage_api_version: '1.1',
    client_id: 'methlab.xyz',
    user_id: 'public_user_id',
    fullscreen: false,
    autosize: true,
};

const TokenPageComp = () => {
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const tokenAddress = searchParams.get('address') as `0x${string}` | null;

  if (!tokenAddress) {
    return <div className="min-h-screen flex items-center justify-center">Invalid token address</div>;
  }

  const { data: tokenData } = useReadContract({
    abi: UniPumpAbi,
    address: UNIPUMP_ADDRESS,
    functionName: 'getTokenData',
    args: [tokenAddress],
  });

  if (!tokenData) {
    return <div className="min-h-screen flex items-center justify-center">Token not found</div>;
  }

  const { data: capData } = useReadContract({
    abi: UniPumpAbi,
    address: UNIPUMP_ADDRESS,
    functionName: 'cap',
    args: [tokenAddress],
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Section */}
      <header className="bg-gray-800 py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{tokenData.name}</h1>
            <p className="text-gray-400">{tokenData.symbol}</p>
          </div>
          <div className="text-right">
            <p className="text-green-500">Market Cap: ${capData ? Big(formatUnits(capData, 18)).toFixed(2) : '0'}</p>
            <p className="text-gray-400">Created by: <Address address={tokenData.createdBy} /></p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Chart Section */}
        <section className="md:col-span-2">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Performance Chart</h2>
            {/* Placeholder for chart */}
            <div className="h-96 bg-gray-700 rounded-lg flex items-center justify-center">
              {tokenAddress === "0x0f1aa5058a58e56d99365fbab232bef578a0ad2d" ? 
                <img src={"/images/tv.jpeg"} alt="pump" className="w-full h-full object-cover" /> :
                <TradingViewChartMain {...defaultWidgetProps} symbol={tokenData.symbol} />
              }
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <BuySell tokenData={tokenData} />
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <CryptoDashboard tokenData={tokenData} />
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 py-4 text-center text-gray-400">
        <p>&copy; 2025 Frontier. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default TokenPageComp;

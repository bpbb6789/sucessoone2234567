"use client";
import { Button } from "@/components/ui/button";
import useGetAllSales from "@/hooks/useGetAllSales";
// Use regular img tag instead of Next.js Image since we're using Vite
import { useLocation } from "wouter";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";

export function CryptoPortfolio({ heldOnly, createdOnly }: { heldOnly?: boolean, createdOnly?: boolean }) {
  const { data } = useGetAllSales();
  const { address } = useAccount();
  const [, setLocation] = useLocation();
  // Only show up to 6 tokens (2 rows of 3)
  const visibleTokens = data ? data.slice(0, 6) : [];
  const hasMore = data && data.length > 6;
  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleTokens.map(token => (
            <TokenCard token={token} key={token.memeTokenAddress} userAddress={address} heldOnly={!!(typeof heldOnly !== 'undefined' && heldOnly)} createdOnly={!!(typeof createdOnly !== 'undefined' && createdOnly)} />
          ))}
        </div>
        {hasMore && (
          <div className="flex justify-end mt-6">
            <Button
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setLocation('/listings')}
            >
              See all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export const TokenCard = ({ token, userAddress, heldOnly, createdOnly }: { token: any, userAddress: string, heldOnly?: boolean, createdOnly?: boolean }) => {
  const { data } = useReadContract({
    abi: erc20Abi,
    address: token.memeTokenAddress,
    functionName: "balanceOf",
    args: [userAddress as `0x${string}`],
    query: {
      select(data) {
        return formatUnits(data, 18)
      },
    }
  });
  const [, setLocation] = useLocation();
  // Filtering logic
  if (heldOnly && (!data || parseFloat(data) === 0)) return null;
  if (createdOnly && token.createdBy?.toLowerCase() !== userAddress?.toLowerCase()) return null;
  return (
    <div key={token.memeTokenAddress} className="mb-4">
      <div className="rounded-xl border border-stone-800 bg-stone-950 text-stone-50 shadow p-4 flex flex-col items-center gap-4">
        {token.imageUri && token.imageUri.trim() !== '' ? (
          <img
            src={token.imageUri}
            alt={`${token.name} icon`}
            width={64}
            height={64}
            className="rounded-full border border-stone-700 object-cover"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              const fallback = target.nextElementSibling as HTMLElement;
              target.style.display = 'none';
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border border-stone-700 flex items-center justify-center text-white font-bold text-lg ${token.imageUri && token.imageUri.trim() !== '' ? 'hidden' : ''}`}>
          {token.symbol?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-2 mb-1 justify-center">
            <span className="font-bold text-lg text-stone-50">{token.name}</span>
            <span className="text-xs bg-stone-800 px-2 py-1 rounded text-stone-300">{token.symbol}</span>
          </div>
          <div className="text-stone-400 text-xs mb-1 truncate text-center">{token.bio}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400 mb-1 justify-center">
            <span>Creator:</span>
            <span className="bg-stone-800 px-2 py-1 rounded text-white">
              {token.createdBy ? `${token.createdBy.slice(0, 6)}...${token.createdBy.slice(-4)}` : 'No Creator'}
            </span>
          </div>
          <div className="flex gap-2 mb-1 justify-center">
            {token.twitter && (
              <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:opacity-80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-label="Twitter" className="inline-block align-middle">
                  <path d="M22.46 5.924c-.793.352-1.646.59-2.542.698a4.48 4.48 0 0 0 1.965-2.475 8.94 8.94 0 0 1-2.828 1.082A4.48 4.48 0 0 0 16.11 4c-2.48 0-4.49 2.01-4.49 4.49 0 .352.04.695.116 1.022C7.728 9.37 4.1 7.6 1.67 4.98c-.387.664-.61 1.437-.61 2.26 0 1.56.795 2.936 2.006 3.744a4.47 4.47 0 0 1-2.034-.563v.057c0 2.18 1.55 4.002 3.61 4.417-.377.103-.775.158-1.186.158-.29 0-.57-.028-.844-.08.57 1.78 2.23 3.08 4.2 3.12A8.98 8.98 0 0 1 2 19.54a12.67 12.67 0 0 0 6.86 2.01c8.23 0 12.74-6.82 12.74-12.74 0-.194-.004-.388-.013-.58A9.1 9.1 0 0 0 24 4.59a8.98 8.98 0 0 1-2.54.7z"/>
                </svg>
              </a>
            )}
            {token.discord && (
              <a href={token.discord} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:opacity-80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-label="Discord" className="inline-block align-middle">
                  <path d="M20.317 4.369A19.791 19.791 0 0 0 16.885 3.1a.112.112 0 0 0-.119.056c-.524.927-1.11 2.13-1.527 3.084a17.876 17.876 0 0 0-5.076 0A12.76 12.76 0 0 0 8.62 3.157a.115.115 0 0 0-.119-.057A19.736 19.736 0 0 0 3.677 4.369a.105.105 0 0 0-.047.043C.533 9.046-.32 13.58.099 18.057a.12.12 0 0 0 .045.083c1.912 1.404 3.77 2.263 5.586 2.834a.115.115 0 0 0 .123-.042c.43-.593.813-1.217 1.144-1.87a.112.112 0 0 0-.062-.155c-.622-.235-1.214-.52-1.783-.83a.112.112 0 0 1-.011-.188c.12-.09.24-.183.353-.277a.112.112 0 0 1 .114-.013c3.781 1.728 7.87 1.728 11.607 0a.112.112 0 0 1 .115.012c.114.094.234.187.354.278a.112.112 0 0 1-.01.188c-.57.31-1.162.595-1.784.83a.112.112 0 0 0-.062.155c.34.653.713 1.277 1.144 1.87a.115.115 0 0 0 .123.042c1.817-.571 3.675-1.43 5.587-2.834a.12.12 0 0 0 .045-.083c.5-5.177-.838-9.673-3.573-13.645a.104.104 0 0 0-.047-.043zM8.02 15.331c-1.13 0-2.062-1.037-2.062-2.308 0-1.27.914-2.308 2.062-2.308 1.14 0 2.063 1.047 2.062 2.308 0 1.27-.914 2.308-2.062 2.308zm7.96 0c-1.13 0-2.062-1.037-2.062-2.308 0-1.27.914-2.308 2.062-2.308 1.14 0 2.063 1.047 2.062 2.308 0 1.27-.914 2.308-2.062 2.308z"/>
                </svg>
              </a>
            )}
          </div>
          <div className="text-emerald-400 font-medium text-xs text-center">
            Balance: {data ? data : "0"} {token.symbol}
          </div>
        </div>
        <div className="flex flex-col gap-2 min-w-[120px] w-full">
          <Button
            variant="default"
            size="sm"
            onClick={() => setLocation(`/token/?address=${token.memeTokenAddress}&tab=buy`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
          >
            BUY
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/token/?address=${token.memeTokenAddress}`)}
            className="text-zinc-400 hover:text-white w-full"
          >
            View Coin
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TokenCard;

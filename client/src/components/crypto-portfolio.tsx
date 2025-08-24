"use client";
import { Button } from "@/components/ui/button";
import useGetAllSales from "@/hooks/useGetAllSales";
import { useAccount } from "wagmi";
import { useLocation } from "wouter";
import TokenCard from "@/components/TokenCard";

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
          {visibleTokens.map((token: any) => (
            <TokenCard token={token} key={token.memeTokenAddress} userAddress={address || ""} heldOnly={!!heldOnly} createdOnly={!!createdOnly} />
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
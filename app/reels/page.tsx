"use client";

import { ReelCard } from "@/components/ReelCard";
import useGetAllSales from "@/hooks/useGetAllSales";

// Dummy data to complement the real token data
const reelStats = {
  defaultLikes: 1200,
  defaultComments: 450,
  defaultShares: 280,
};

export default function ReelsPage() {
  const { data: tokens } = useGetAllSales();

  return (
    <div className="min-h-screen bg-site-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Trending Reels</h1>
          <p className="text-zinc-400 text-center max-w-2xl">
            Watch the latest meme token launches and trending channels in action. Discover new opportunities and stay updated with the community.
          </p>
        </div>

        {/* Reels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tokens?.map((token, index) => (
            <ReelCard
              key={token.memeTokenAddress}
              title={`${token.name} - The Next Big Meme Token 🚀`}
              author={token.createdBy.slice(0, 6) + "..." + token.createdBy.slice(-4)}
              thumbnail={token.imageUri || "https://picsum.photos/seed/" + index + "/400/600"}
              likes={reelStats.defaultLikes + (index * 127)}
              comments={reelStats.defaultComments + (index * 43)}
              shares={reelStats.defaultShares + (index * 67)}
              tokenSymbol={token.symbol}
              tokenAddress={token.memeTokenAddress}
            />
          ))}
        </div>

        {/* Loading State */}
        {!tokens && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}

        {/* Empty State */}
        {tokens?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-zinc-400">No reels available yet</p>
            <p className="text-zinc-500">Be the first to create a token and share your story!</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { CryptoPortfolio } from "@/components/crypto-portfolio";

export default function ListingsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#23234b] to-[#0f3460] py-20">
      <div className="w-full max-w-7xl px-2 md:px-8 z-10 mt-8">
  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">Trending Channels</h2>
        <CryptoPortfolio />
      </div>
    </div>
  );
}

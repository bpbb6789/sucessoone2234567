
import { CryptoPortfolio } from "@/components/crypto-portfolio";
import { ReelsSection } from "@/components/reels/ReelsSection";
import { Toaster } from 'react-hot-toast';
import { Suspense } from "react";

const HomePage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="relative min-h-screen flex flex-col items-center bg-site-main overflow-x-hidden">
        <Toaster />
  {/* Trending Channels Row (show all tokens as cards) */}
        <div className="w-full max-w-7xl px-2 md:px-8 z-10 mt-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Trending Channels</h2>
          <CryptoPortfolio />
        </div>
        {/* Reels Section */}
        <ReelsSection />
      </div>
    </Suspense>
  );
};

export default HomePage;

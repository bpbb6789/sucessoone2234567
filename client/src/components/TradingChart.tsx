import React, { useEffect, useRef } from 'react';

interface TradingChartProps {
  tokenAddress: string;
  symbol: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradingChart({ tokenAddress, symbol }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        new window.TradingView.widget({
          width: "100%",
          height: 400,
          symbol: `DEXSCREENER:${tokenAddress}`, // Use Dexscreener data
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#1e1e1e",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerRef.current.id,
          studies: [
            "Volume@tv-basicstudies"
          ],
          show_popup_button: false,
          popup_width: "1000",
          popup_height: "650",
          no_referral_id: true
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [tokenAddress]);

  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      <div 
        ref={containerRef} 
        id={`tradingview_${tokenAddress.slice(-8)}`}
        className="w-full h-full"
      >
        {/* Fallback while loading */}
        <div className="flex items-center justify-center h-full text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Loading {symbol} chart...</p>
            <p className="text-sm text-gray-400 mt-2">Powered by TradingView</p>
          </div>
        </div>
      </div>
    </div>
  );
}
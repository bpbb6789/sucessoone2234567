// Removed lucide-react icons import as we're using emojis now
import { Link, useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useGetAllChannels } from "@/hooks/useGetAllChannels";
import { useState, useEffect } from "react";

// Component to fetch and display real channel stats
function ChannelRealStats({ coinAddress, ticker }: { coinAddress?: string; ticker?: string }) {
  const [marketCap, setMarketCap] = useState<string>('Loading...');
  const [holders, setHolders] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!coinAddress) {
        setMarketCap('$0.00');
        setHolders(0);
        return;
      }

      try {
        // Add timeout to prevent infinite loading
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort(new Error('Request timeout'));
        }, 10000); // 10 second timeout

        // For Zora-based channels, fetch price data from Zora's infrastructure
        // Check if this is a Zora channel by trying to get Zora price data first
        let isZoraChannel = false;
        let marketCapValue = '$0.00';
        let holderCount = 0;

        try {
          // Try to fetch Zora price data using the Zora SDK endpoint
          const zoraResponse = await fetch(`/api/creator-coins/zora-price/${coinAddress}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          });

          if (zoraResponse.ok) {
            const zoraData = await zoraResponse.json();
            isZoraChannel = true;

            if (zoraData.marketCap && parseFloat(zoraData.marketCap) > 0) {
              const marketCap = parseFloat(zoraData.marketCap);
              if (marketCap >= 1000000) {
                marketCapValue = `$${(marketCap / 1000000).toFixed(2)}M`;
              } else if (marketCap >= 1000) {
                marketCapValue = `$${(marketCap / 1000).toFixed(2)}K`;
              } else {
                marketCapValue = `$${marketCap.toFixed(2)}`;
              }
            }

            holderCount = zoraData.holders || 0;
          }
        } catch (zoraError) {
          console.log('Not a Zora channel or Zora data unavailable, trying UniPump...');
        }

        // If not a Zora channel, fall back to UniPump data
        if (!isZoraChannel) {
          // Fetch real market cap data from UniPump
          const priceResponse = await fetch('https://unipump-contracts.onrender.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              query: `
                query GetTokenData($tokenAddress: String!) {
                  minBuckets(
                    where: { tokenAddress: $tokenAddress }
                    orderBy: { id: desc }
                    first: 1
                  ) {
                    items {
                      close
                      average
                    }
                  }
                  uniPumpCreatorSaless(
                    where: { memeTokenAddress: $tokenAddress }
                  ) {
                    items {
                      totalSupply
                    }
                  }
                }
              `,
              variables: { tokenAddress: coinAddress }
            })
          });

          // Fetch real holder count
          const holdersResponse = await fetch('/api/token-holders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.JSON.stringify({ tokenAddress: coinAddress })
          });

          // Process UniPump market cap data
          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            const bucketData = priceData.data?.minBuckets?.items?.[0];
            const tokenData = priceData.data?.uniPumpCreatorSaless?.items?.[0];

            if (bucketData && tokenData) {
              const price = parseFloat(bucketData.close || bucketData.average || '0');
              const totalSupply = parseFloat(tokenData.totalSupply || '1000000000');
              const calculatedMarketCap = price * Math.min(totalSupply, 800000000); // Max 800M circulating

              if (calculatedMarketCap >= 1000000) {
                marketCapValue = `$${(calculatedMarketCap / 1000000).toFixed(2)}M`;
              } else if (calculatedMarketCap >= 1000) {
                marketCapValue = `$${(calculatedMarketCap / 1000).toFixed(2)}K`;
              } else {
                marketCapValue = `$${calculatedMarketCap.toFixed(2)}`;
              }
            }
          }

          // Process UniPump holder count data
          if (holdersResponse.ok) {
            const holdersData = await holdersResponse.json();
            holderCount = holdersData.holderCount || 0;
          }
        }

        clearTimeout(timeoutId);
        setMarketCap(marketCapValue);
        setHolders(holderCount);

      } catch (error) {
        console.error('Error fetching channel stats:', error);
        // Handle different types of errors
        if (error.name === 'AbortError' || controller.signal.aborted) {
          console.log('Request was aborted or timed out');
        }
        setMarketCap('$0.00');
        setHolders(0);
      }
    };

    fetchStats();
  }, [coinAddress]);

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex items-center gap-1">
        <span className="text-xs text-green-400">💰</span>
        <span className="text-xs text-gray-400">
          {marketCap}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-blue-400">👥</span>
        <span className="text-xs text-gray-400">
          {holders}
        </span>
      </div>
    </div>
  );
}

const mainNavItems = [
  { icon: "🔍", label: "Discover", href: "/" },
  { icon: "✨", label: "Create Token", href: "/contentnew" },
  { icon: "🚀", label: "Launch", href: "/launch" },
  { icon: "🏆", label: "Leaderboard", href: "/leaderboard" },
  { icon: "👨‍🎨", label: "Creators", href: "/creators" },
  { icon: "📺", label: "Channels", href: "/channels" },
];

const additionalItems = [
  { icon: "📄", label: "Doc", href: "/doc" },
  { icon: "📊", label: "Activities", href: "/activities" },
  { icon: "❓", label: "FAQ", href: "/faq" },
  { icon: "🛡️", label: "Admin", href: "/admin" },
];

export function Sidebar() {
  const { isExpanded } = useSidebar();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { data: channels, isLoading: channelsLoading } = useGetAllChannels();

  if (isMobile) {
    return null; // Mobile uses bottom navigation
  }

  return (
    <nav
      className={cn(
        "fixed left-0 top-14 bottom-0 z-40 bg-white dark:bg-youtube-dark border-r border-gray-200 dark:border-youtube-dark-secondary transition-all duration-300 overflow-y-auto",
        isExpanded ? "sidebar-expanded" : "sidebar-collapsed",
      )}
      data-testid="sidebar"
    >
      <div className="py-2">
        {/* Main Navigation */}
        <div className="px-3 mb-4">
          {mainNavItems.map((item) => {
            const isActive = location === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn("nav-item", isActive && "active")}
                  data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {isExpanded && (
                    <span className="sidebar-text">{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {isExpanded && (
          <>
            <hr className="border-gray-200 dark:border-youtube-dark-secondary mx-3 mb-4" />

            {/* Top Trending Channels Section */}
            <div className="px-3 mb-4">
              <h3 className="sidebar-text text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-3">
                📈 Trending Channels
              </h3>
              {channelsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="nav-item">
                      <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse flex-shrink-0" />
                      <div className="sidebar-text flex flex-col flex-1 min-w-0">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-1" />
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : channels && channels.length > 0 ? (
                channels.slice(0, 3).map((channel) => {
                  const channelHref = `/channel/${channel.slug}`;
                  const isActive = location === channelHref;

                  return (
                    <Link key={channel.id} href={channelHref}>
                      <div
                        className={cn("nav-item", isActive && "active")}
                        data-testid={`nav-item-${channel.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <img
                          src={
                            channel.avatarUrl?.startsWith("baf")
                              ? `https://gateway.pinata.cloud/ipfs/${channel.avatarUrl}`
                              : channel.avatarUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&size=32&background=6366f1&color=fff`
                          }
                          alt={channel.name}
                          className="w-6 h-6 rounded-md flex-shrink-0 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&size=32&background=6366f1&color=fff`;
                          }}
                        />
                        <div className="sidebar-text flex flex-col flex-1 min-w-0">
                          <span className="text-sm truncate">
                            {channel.name}
                          </span>
                          <ChannelRealStats 
                            coinAddress={channel.coinAddress}
                            ticker={channel.ticker}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  No channels available
                </div>
              )}
            </div>
          </>
        )}

        {/* Additional Items */}
        <div className={cn("space-y-1", isExpanded ? "px-3" : "px-2")}>
          <h3
            className={cn(
              "mb-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider",
              !isExpanded && "hidden",
            )}
          >
            More
          </h3>
          {additionalItems.map((item) => {
            const isActive = location === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-item", isActive && "active")}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {isExpanded && (
                  <span className="sidebar-text">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
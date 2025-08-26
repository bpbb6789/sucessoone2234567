import {
  Home,
  Play,
  Radio,
  Music,
  Folder,
  History,
  Clock,
  ThumbsUp,
  ChevronDown,
  Coins,
  TrendingUp,
  FileText,
  Activity,
  HelpCircle,
  Upload,
  FileImage,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useGetAllChannels } from "@/hooks/useGetAllChannels";

const mainNavItems = [
  { icon: Home, label: "Discovery", href: "/" },
  { icon: Play, label: "Shorts", href: ROUTES.SHORTS },
  { icon: Coins, label: "Launch Channel", href: "/create-token" },
  { icon: Coins, label: "Tokens", href: "/tokens" },
  { icon: Coins, label: "Creator Coins", href: "/creatorcoins" },
  { icon: FileImage, label: "Content Coins", href: "/Contentcoin" },
  { icon: Upload, label: "Tokenize", href: "/tokenize" },
  { icon: Coins, label: "Create Token", href: "/createtoken" },
  { icon: Coins, label: "Create Content Coin", href: "/create-content-coin" },
];



const additionalItems = [
  { icon: FileText, label: "Doc", href: "/doc" },
  { icon: Activity, label: "Activities", href: "/activities" },
  { icon: HelpCircle, label: "FAQ", href: "/faq" },
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
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn("nav-item", isActive && "active")}
                  data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
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
                Top Trending Channels
              </h3>
              {channelsLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
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
                channels.slice(0, 4).map((channel) => {
                  const channelHref = `/channel/${channel.slug}`;
                  const isActive = location === channelHref;

                  return (
                    <Link key={channel.id} href={channelHref}>
                      <div
                        className={cn("nav-item", isActive && "active")}
                        data-testid={`nav-item-${channel.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <img
                          src={channel.avatarUrl?.startsWith('baf') ? `https://gateway.pinata.cloud/ipfs/${channel.avatarUrl}` : channel.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&size=32&background=6366f1&color=fff`}
                          alt={channel.name}
                          className="w-6 h-6 rounded-full flex-shrink-0 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&size=32&background=6366f1&color=fff`;
                          }}
                        />
                        <div className="sidebar-text flex flex-col flex-1 min-w-0">
                          <span className="text-sm truncate">{channel.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Channel</span>
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
          <h3 className={cn(
            "mb-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider",
            !isExpanded && "hidden"
          )}>
            More
          </h3>
          {additionalItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-item",
                  isActive && "active"
                )}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
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
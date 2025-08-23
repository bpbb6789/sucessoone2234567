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
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { icon: Home, label: "Explore", href: "/tokens" },
  { icon: Play, label: "Shorts", href: ROUTES.SHORTS },
  { icon: Radio, label: "Podcasts", href: ROUTES.SUBSCRIPTIONS },
  { icon: Music, label: "Music", href: ROUTES.MUSIC },
  { icon: TrendingUp, label: "Home", href: ROUTES.HOME },
  { icon: Coins, label: "Launch Channel", href: "/create-token" },
];

const trendingChannels = [
  { icon: TrendingUp, label: "Tech Explorer", href: "/channel/tech-explorer", subscribers: "125K", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" },
  { icon: TrendingUp, label: "Cooking Master", href: "/channel/cooking-master", subscribers: "89K", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" },
  { icon: TrendingUp, label: "Music World", href: "/channel/music-world", subscribers: "250K", avatar: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" },
  { icon: TrendingUp, label: "Gaming Pro", href: "/channel/gaming-pro", subscribers: "180K", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" },
];

const additionalItems = [
  { icon: FileText, label: "Doc", href: "/doc" },
  { icon: Activity, label: "Activities", href: "/activities" },
  { icon: HelpCircle, label: "FAQ", href: "/faq" },
];

const subscriptionChannels = [
  {
    name: "Tech Explorer",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
  },
  {
    name: "Gaming Pro",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
  },
  {
    name: "Cooking Master",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
  },
];

export function Sidebar() {
  const { isExpanded } = useSidebar();
  const [location] = useLocation();
  const isMobile = useIsMobile();

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
              {trendingChannels.map((channel) => {
                const isActive = location === channel.href;

                return (
                  <Link key={channel.href} href={channel.href}>
                    <div
                      className={cn("nav-item", isActive && "active")}
                      data-testid={`nav-item-${channel.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <img
                        src={channel.avatar}
                        alt={channel.label}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                      />
                      <div className="sidebar-text flex flex-col flex-1 min-w-0">
                        <span className="text-sm truncate">{channel.label}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{channel.subscribers}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <hr className="border-gray-200 dark:border-youtube-dark-secondary mx-3 mb-4" />

            {/* Subscriptions */}
            <div className="px-3 mb-4">
              <h3 className="sidebar-text text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-3">
                Create a Channel
              </h3>
              <div className="space-y-1">
                {subscriptionChannels.map((channel) => (
                  <div
                    key={channel.name}
                    className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-youtube-dark-hover transition-colors cursor-pointer"
                    data-testid={`subscription-${channel.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <img
                      src={channel.avatar}
                      alt={channel.name}
                      className="w-6 h-6 rounded-full mr-4 flex-shrink-0"
                    />
                    <span className="sidebar-text text-sm">{channel.name}</span>
                  </div>
                ))}
              </div>
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
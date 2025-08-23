import { Home, Play, Radio, Music, Folder, History, Clock, ThumbsUp, ChevronDown, Coins, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { icon: Home, label: "Channels", href: "/tokens" },
  { icon: Play, label: "Shorts", href: ROUTES.SHORTS },
  { icon: Radio, label: "Subscriptions", href: ROUTES.SUBSCRIPTIONS },
  { icon: Music, label: "YouTube Music", href: ROUTES.MUSIC },
  { icon: TrendingUp, label: "Home", href: ROUTES.HOME },
  { icon: Coins, label: "Launch Token", href: "/create-token" },
];

const libraryItems = [
  { icon: Folder, label: "Library", href: ROUTES.LIBRARY },
  { icon: History, label: "History", href: ROUTES.HISTORY },
  { icon: Clock, label: "Watch later", href: ROUTES.WATCH_LATER },
  { icon: ThumbsUp, label: "Liked videos", href: ROUTES.LIKED_VIDEOS },
];

const subscriptionChannels = [
  {
    name: "Tech Explorer",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
  },
  {
    name: "Gaming Pro",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
  },
  {
    name: "Cooking Master",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
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
        isExpanded ? "sidebar-expanded" : "sidebar-collapsed"
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
                  className={cn(
                    "nav-item",
                    isActive && "active"
                  )}
                  data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  {isExpanded && <span className="sidebar-text">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </div>
        
        {isExpanded && (
          <>
            <hr className="border-gray-200 dark:border-youtube-dark-secondary mx-3 mb-4" />
            
            {/* You Section */}
            <div className="px-3 mb-4">
              <h3 className="sidebar-text text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-3">
                You
              </h3>
              {libraryItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "nav-item",
                        isActive && "active"
                      )}
                      data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="w-6 h-6 flex-shrink-0" />
                      <span className="sidebar-text">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <hr className="border-gray-200 dark:border-youtube-dark-secondary mx-3 mb-4" />
            
            {/* Subscriptions */}
            <div className="px-3 mb-4">
              <h3 className="sidebar-text text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-3">
                Subscriptions
              </h3>
              <div className="space-y-1">
                {subscriptionChannels.map((channel) => (
                  <div
                    key={channel.name}
                    className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-youtube-dark-hover transition-colors cursor-pointer"
                    data-testid={`subscription-${channel.name.toLowerCase().replace(/\s+/g, '-')}`}
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
      </div>
    </nav>
  );
}

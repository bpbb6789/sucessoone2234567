import { Home, Play, PlusCircle, Radio, User, Activity } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Channels", href: "/tokens" },
  { icon: Play, label: "Shorts", href: ROUTES.SHORTS },
  { icon: PlusCircle, label: "Create", href: "/create-token" },
  { icon: Radio, label: "Subscriptions", href: ROUTES.SUBSCRIPTIONS },
  { icon: Activity, label: "Activities", href: ROUTES.ACTIVITIES },
  { icon: User, label: "Profile", href: ROUTES.PROFILE },
];

export function MobileNavigation() {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-youtube-dark border-t border-gray-200 dark:border-youtube-dark-secondary"
      data-testid="mobile-navigation"
    >
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "mobile-nav-item",
                  isActive && "active"
                )}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

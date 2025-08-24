import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isExpanded } = useSidebar();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  
  // Check if we're on the shorts page for mobile full-screen experience
  const isShortsPage = location === '/shorts';
  const shouldHideHeaderOnMobile = isMobile && isShortsPage;
  const shouldHideMobileNavOnMobile = false; // Always show mobile nav

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/30 to-gray-50 dark:from-purple-900/20 dark:to-black text-gray-900 dark:text-white transition-theme">
      {!shouldHideHeaderOnMobile && <Header />}
      <Sidebar />
      
      <main
        className={cn(
          "transition-all duration-300",
          // Only add top padding if header is visible
          !shouldHideHeaderOnMobile && "pt-14",
          !isMobile && (isExpanded ? "content-expanded" : "content-collapsed"),
          // Only add bottom padding if mobile nav is visible
          isMobile && !shouldHideMobileNavOnMobile && "pb-16"
        )}
        data-testid="main-content"
      >
        {children}
      </main>
      
      {!shouldHideMobileNavOnMobile && <MobileNavigation />}
    </div>
  );
}

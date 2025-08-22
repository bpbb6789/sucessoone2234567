import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isExpanded } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background transition-theme">
      <Header />
      <Sidebar />
      
      <main
        className={cn(
          "pt-14 transition-all duration-300",
          !isMobile && (isExpanded ? "content-expanded" : "content-collapsed"),
          isMobile && "pb-16" // Account for mobile bottom navigation
        )}
        data-testid="main-content"
      >
        {children}
      </main>
      
      <MobileNavigation />
    </div>
  );
}

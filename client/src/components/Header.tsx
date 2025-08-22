import { Search, Menu, Mic, Bell, Upload, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { useSidebar } from "@/hooks/use-sidebar";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-youtube-dark border-b border-gray-200 dark:border-youtube-dark-secondary transition-theme"
      data-testid="header"
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-youtube-dark-hover"
            data-testid="button-menu-toggle"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-1 cursor-pointer" data-testid="link-home" onClick={() => window.location.href = "/"}>
            <div className="text-youtube-red text-2xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <span className="text-xl font-medium hidden sm:inline">YouTube</span>
          </div>
        </div>

        {/* Search Section */}
        {!isMobile && (
          <div className="flex-1 max-w-2xl mx-4 flex">
            <div className="flex items-center w-full">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-youtube-dark-secondary rounded-l-full bg-white dark:bg-youtube-dark-secondary focus:outline-none focus:ring-1 focus:ring-blue-500"
                  data-testid="input-search"
                />
              </div>
              <Button
                variant="outline"
                className="px-6 py-2 border border-l-0 border-gray-300 dark:border-youtube-dark-secondary rounded-r-full bg-gray-50 dark:bg-youtube-dark-secondary hover:bg-gray-100 dark:hover:bg-youtube-dark-hover"
                data-testid="button-search"
                onClick={() => window.location.href = "/search"}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-youtube-dark-hover"
              data-testid="button-voice-search"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-youtube-dark-hover"
              data-testid="button-search-mobile"
              onClick={() => window.location.href = "/search"}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-youtube-dark-hover"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-youtube-dark-hover"
            data-testid="button-upload"
            onClick={() => window.location.href = "/create"}
          >
            <Upload className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-youtube-dark-hover"
            data-testid="button-notifications"
            onClick={() => window.location.href = "/notifications"}
          >
            <Bell className="h-4 w-4" />
          </Button>

          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
            alt="User Avatar"
            className="w-8 h-8 rounded-full cursor-pointer"
            data-testid="img-user-avatar"
            onClick={() => window.location.href = "/profile"}
          />
        </div>
      </div>
    </header>
  );
}
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  Activity,
  Grid3X3,
  LogOut,
  Moon,
  Sun,
  Plus,
  FileText,
  HelpCircle,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Link } from "wouter";
import { ROUTES } from "@/lib/constants";

interface WalletConnectButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function WalletConnectButton({
  className,
  variant = "default",
  size = "default",
}: WalletConnectButtonProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className={cn("", className)}>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === "authenticated");

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className={cn(
                        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                        variant === "default" &&
                          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                        variant === "outline" &&
                          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                        variant === "secondary" &&
                          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                        variant === "ghost" &&
                          "hover:bg-accent hover:text-accent-foreground",
                        size === "default" && "h-9 px-4 py-2",
                        size === "sm" && "h-8 rounded-md px-3 text-xs",
                        size === "lg" && "h-10 rounded-md px-8",
                      )}
                      data-testid="connect-wallet-button"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className={cn(
                        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700",
                        size === "default" && "h-9 px-4 py-2",
                        size === "sm" && "h-8 rounded-md px-3 text-xs",
                        size === "lg" && "h-10 rounded-md px-8",
                      )}
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <div className="flex gap-2">
                    <button
                      onClick={openChainModal}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80",
                        size === "default" && "h-9 px-3 py-2",
                        size === "sm" && "h-8 rounded-md px-2 text-xs",
                        size === "lg" && "h-10 rounded-md px-4",
                      )}
                      type="button"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            overflow: "hidden",
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              style={{ width: 16, height: 16 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
                            variant === "default" &&
                              "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                            variant === "outline" &&
                              "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                            variant === "secondary" &&
                              "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                            variant === "ghost" &&
                              "hover:bg-accent hover:text-accent-foreground",
                            size === "default" && "h-9 px-4 py-2",
                            size === "sm" && "h-8 rounded-md px-3 text-xs",
                            size === "lg" && "h-10 rounded-md px-8",
                          )}
                        >
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${account.address}`}
                            alt="Profile Avatar"
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="hidden sm:inline">
                            {account.displayName}
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 p-4" align="end">
                        {/* Profile Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${account.address}`}
                            alt="Profile Avatar"
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {account.displayName}
                              </p>
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                PRO
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {account.address.slice(0, 6)}...
                              {account.address.slice(-4)}@web3.io
                            </p>
                          </div>
                        </div>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                          <DropdownMenuItem className="flex items-center gap-3 py-2 cursor-pointer">
                            <User className="w-4 h-4" />
                            <Link href={ROUTES.PROFILE} className="flex-1">
                              Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-3 py-2 cursor-pointer">
                            <Settings className="w-4 h-4" />
                            <span className="flex-1">Settings</span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            className="flex items-center gap-3 py-2 cursor-pointer"
                            onClick={toggleTheme}
                          >
                            {theme === "dark" ? (
                              <Sun className="w-4 h-4" />
                            ) : (
                              <Moon className="w-4 h-4" />
                            )}
                            <span className="flex-1">
                              {theme === "dark" ? "Light Mode" : "Dark Mode"}
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        

                        <DropdownMenuItem
                          className="flex items-center gap-3 py-2 cursor-pointer text-red-600 hover:text-red-700"
                          onClick={openAccountModal}
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="flex-1">Logout</span>
                        </DropdownMenuItem>

                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground text-center">
                            v1.5.69 • Balance:{" "}
                            {account.displayBalance || "0 ETH"}
                          </p>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}

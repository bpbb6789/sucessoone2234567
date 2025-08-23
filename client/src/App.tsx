import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
// import { WagmiProvider } from 'wagmi'; // Not available in this version
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Shorts from "@/pages/Shorts";
import Subscriptions from "@/pages/Subscriptions";
import Music from "@/pages/Music";
import Library from "@/pages/Library";
import History from "@/pages/History";
import WatchLater from "@/pages/WatchLater";
import LikedVideos from "@/pages/LikedVideos";
import Watch from "@/pages/Watch";
import Profile from "@/pages/Profile";
import Create from "@/pages/Create";
import Notifications from "@/pages/Notifications";
import Search from "@/pages/Search";
import Token from "@/pages/Token";
// import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
// import { config } from './lib/walletConnect';
// import '@rainbow-me/rainbowkit/styles.css';

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shorts" component={Shorts} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/music" component={Music} />
        <Route path="/library" component={Library} />
        <Route path="/history" component={History} />
        <Route path="/watch-later" component={WatchLater} />
        <Route path="/liked-videos" component={LikedVideos} />
        <Route path="/watch/:id" component={Watch} />
        <Route path="/profile" component={Profile} />
        <Route path="/create" component={Create} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/search" component={Search} />
        <Route path="/token" component={Token} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
      <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="youtube-theme">
            <SidebarProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </SidebarProvider>
          </ThemeProvider>
      </QueryClientProvider>
  );
}

export default App;
import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { Route, Switch } from 'wouter'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Layout } from '@/components/Layout'
import { SidebarProvider } from '@/hooks/use-sidebar'
import { queryClient } from '@/lib/queryClient'
import { useWagmiConfig } from '../../wagmi'
import { ApolloWrapper } from '../../lib/apollo-provider'

// Pages
import Home from '@/pages/Home'
import Shorts from '@/pages/Shorts'
import Subscriptions from '@/pages/Subscriptions'
import Library from '@/pages/Library'
import History from '@/pages/History'
import LikedVideos from '@/pages/LikedVideos'
import WatchLater from '@/pages/WatchLater'
import Music from '@/pages/Music'
import Profile from '@/pages/Profile'
import Search from '@/pages/Search'
import Create from '@/pages/Create'
import Watch from '@/pages/Watch'
import Token from '@/pages/Token'
import Tokens from '@/pages/Tokens'
import Discovery from '@/pages/Discovery'
import CreateChannel from '@/components/CreateChannel'
import ChannelManager from '@/components/ChannelManager'
import Notifications from '@/pages/Notifications'
import Activities from "@/pages/Activities";
import Doc from "@/pages/Doc";
import FAQ from "@/pages/FAQ";
import ContentImport from '@/pages/ContentImport';
import MyContent from '@/pages/MyContent';
import ContentDetail from '@/pages/ContentDetail';
import ChannelDetail from '@/pages/ChannelDetail';
import PostDetail from '@/pages/PostDetail';
import Tokenize from '@/pages/Tokenize'
import CreatePad from '@/pages/CreatePad'
import NotFound from '@/pages/not-found'

import '@rainbow-me/rainbowkit/styles.css'
import './index.css'

// Use existing query client from lib

function WagmiApp() {
  const config = useWagmiConfig()

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

function AppContent() {
  return (
    <ApolloWrapper>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SidebarProvider>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/discovery" component={Discovery} />
              <Route path="/shorts" component={Shorts} />
              <Route path="/subscriptions" component={Subscriptions} />
              <Route path="/library" component={Library} />
              <Route path="/history" component={History} />
              <Route path="/liked" component={LikedVideos} />
              <Route path="/watchlater" component={WatchLater} />
              <Route path="/music" component={Music} />
              <Route path="/profile" component={Profile} />
              <Route path="/activities" component={Activities} />
              <Route path="/notifications" component={Notifications} />
              <Route path="/search" component={Search} />
              <Route path="/create-token" component={CreateChannel} />
              <Route path="/watch/:id" component={Watch} />
              <Route path="/tokens" component={Tokens} />
              <Route path="/tokenize" component={Tokenize} />
              <Route path="/create" component={Create} />
              <Route path="/create-channel" component={CreateChannel} />
              <Route path="/create-pad" component={CreatePad} />
              <Route path="/channel/:slug/manager" component={ChannelManager} />
              <Route path="/dashboard/import" component={ContentImport} />
              <Route path="/my-content" component={MyContent} />
              <Route path="/content/:id" component={ContentDetail} />
              <Route path="/channel/:id" component={ChannelDetail} />
              <Route path="/:type/:id" component={PostDetail} />
              <Route path="/doc" component={Doc} />
              <Route path="/faq" component={FAQ} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
          <Toaster />
        </SidebarProvider>
      </ThemeProvider>
    </ApolloWrapper>
  )
}

function App() {
  return <WagmiApp />
}

export default App
import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { WagmiConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { Route, Switch } from 'wouter'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Layout } from '@/components/Layout'
import { SidebarProvider } from '@/hooks/use-sidebar'
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext'
import { GlobalMusicPlayer } from '@/components/GlobalMusicPlayer'
import { queryClient } from '@/lib/queryClient'
import { useWagmiConfig } from '../../wagmi'
import { ApolloWrapper } from '../../lib/apollo-provider'
import { lazy } from 'react'

// Pages
import Home from '@/pages/Home'
import Subscriptions from '@/pages/Subscriptions'
import Subscribers from "@/pages/Subscribers";
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
import CreateToken from '@/pages/CreateToken'
import CreatorCoins from '@/pages/CreatorCoins'
import CreateContentCoin from '@/pages/CreateContentCoin'
import ContentCoin from '@/pages/ContentCoin'
import ContentCoinDetail from "./pages/ContentCoinDetail";
import TokenDetail from '@/pages/TokenDetail'
import TokenTrade from '@/pages/TokenTrade'
// PumpTokens page removed - import PumpTokens from '@/pages/PumpTokens'
import NotFound from '@/pages/not-found'
import Channels from "./pages/Channels";
import Contents from "@/pages/Contents";

import Creators from '@/pages/Creators';
import Leaderboard from './pages/Leaderboard';
import Admin from "./pages/Admin";

import Feed from "./pages/Feed";
import ContentNew from "@/pages/ContentNew";
import ExploreContent from "@/pages/ExploreContent";

import '@rainbow-me/rainbowkit/styles.css'
import './index.css'

// Use existing query client from lib

function WagmiApp() {
  const config = useWagmiConfig()

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={import.meta.env.VITE_NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
        >
          <RainbowKitProvider>
            <AppContent />
          </RainbowKitProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  )
}

function AppContent() {
  return (
    <ApolloWrapper>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <MusicPlayerProvider>
          <SidebarProvider>
            <Layout>
              <Switch>
                <Route path="/" component={ContentCoin} />
                <Route path="/subscriptions" component={Subscriptions} />
                <Route path="/profile/subscribers" component={Subscribers} />
                <Route path="/library" component={Library} />
                <Route path="/history" component={History} />
                <Route path="/liked" component={LikedVideos} />
                <Route path="/watchlater" component={WatchLater} />
                <Route path="/music" component={Music} />
                <Route path="/feed" component={Feed} />
                <Route path="/profile" component={Profile} />
                <Route path="/notifications" component={Notifications} />
                <Route path="/activities" component={Activities} />
                <Route path="/search" component={Search} />
                <Route path="/create-token" component={CreateChannel} />
                <Route path="/createtoken" component={CreateToken} />
                <Route path="/create-content-coin" component={CreateContentCoin} />
                <Route path="/zoracreate" component={ZoraCreate} />
                <Route path="/zoraexplore" component={ZoraExplore} />
                <Route path="/watch/:id" component={Watch} />
                <Route path="/creatorcoins" component={CreatorCoins} />
                <Route path="/contentcoin" component={ContentCoin} />
                <Route path="/contents" component={Contents} />
                <Route path="/content/:network/:address" component={ContentCoinDetail} />
                <Route path="/content/:id" component={ContentDetail} />
                <Route path="/tokenize" component={Tokenize} />
                <Route path="/create" component={Create} />
                <Route path="/admin" component={Admin} />
                <Route path="/create-channel" component={CreateChannel} />
                <Route path="/create-pad" component={CreatePad} />
                <Route path="/create-content-coin" component={CreateContentCoin} />
                <Route path="/token/:id" component={TokenDetail} />
                {/* PumpTokens route removed - <Route path="/pumptokens" component={PumpTokens} /> */}
                <Route path="/content-coin/trade/:network/:address" component={TokenTrade} />
                <Route path="/channel/:slug/manager" component={ChannelManager} />
                <Route path="/dashboard/import" component={ContentImport} />
                <Route path="/my-content" component={MyContent} />
                <Route path="/channel/:slug" component={ChannelDetail} />
                <Route path="/:type/:id" component={PostDetail} />
                <Route path="/doc" component={Doc} />
                <Route path="/faq" component={FAQ} />
                <Route path="/creators" component={Creators} /> {/* New route for Creators page */}
                <Route path="/channels" component={Channels} />
                <Route path="/leaderboard" component={Leaderboard} />
                <Route path="/contentnew" component={ContentNew} />
                <Route path="/explorecontent" component={ExploreContent} />
                <Route component={NotFound} />
              </Switch>
            </Layout>
            <GlobalMusicPlayer />
            <Toaster />
          </SidebarProvider>
        </MusicPlayerProvider>
      </ThemeProvider>
    </ApolloWrapper>
  )
}

function App() {
  return <WagmiApp />
}

export default App
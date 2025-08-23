import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Layout } from '@/components/Layout'
import { SidebarProvider } from '@/hooks/use-sidebar'
import { queryClient } from '@/lib/queryClient'
import { useWagmiConfig } from '../../wagmi'

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
import CreateTokenPage from '@/pages/CreateToken'
import Watch from '@/pages/Watch'
import Token from '@/pages/Token'
import Tokens from '@/pages/Tokens'
import Notifications from '@/pages/Notifications'
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
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <Router>
          <Layout>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shorts" element={<Shorts />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/library" element={<Library />} />
            <Route path="/history" element={<History />} />
            <Route path="/liked" element={<LikedVideos />} />
            <Route path="/watchlater" element={<WatchLater />} />
            <Route path="/music" element={<Music />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/create-token" element={<CreateTokenPage />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/token/:address" element={<Token />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Layout>
          <Toaster />
        </Router>
      </SidebarProvider>
    </ThemeProvider>
  )
}

function App() {
  return <WagmiApp />
}

export default App
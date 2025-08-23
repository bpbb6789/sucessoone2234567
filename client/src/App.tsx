import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/ThemeProvider'
import Layout from '@/components/Layout'
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
import Watch from '@/pages/Watch'
import Token from '@/pages/Token'
import Notifications from '@/pages/Notifications'
import NotFound from '@/pages/not-found'

import '@rainbow-me/rainbowkit/styles.css'
import './index.css'

// Create a client
const queryClient = new QueryClient()

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
            <Route path="/create" element={<Create />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/token/:address" element={<Token />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
        <Toaster />
      </Router>
    </ThemeProvider>
  )
}

function App() {
  return <WagmiApp />
}

export default App
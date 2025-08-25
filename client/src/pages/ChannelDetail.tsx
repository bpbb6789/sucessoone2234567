import { useState } from 'react'
import { useParams, Link } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface ChannelDetail {
  id: string
  name: string
  ticker: string
  owner: string
  category: string
  avatarUrl: string
  coverUrl: string
  coinAddress: string
  chainId: number
  createdAt: string
  description?: string
}

interface TokenData {
  price: string
  marketCap: string
  volume24h: string
  holders: number
  change24h: number
}

// Mock chart data for now
const chartData = [
  { time: '1H', value: 650 },
  { time: '6H', value: 700 },
  { time: '12H', value: 680 },
  { time: '1D', value: 757 },
]

export default function ChannelDetail() {
  const { id } = useParams()
  const [tradeAmount, setTradeAmount] = useState('')
  const [comment, setComment] = useState('')
  

  const { data: channelsData = [], isLoading } = useQuery({
    queryKey: ['/api/web3-channels'],
    queryFn: async () => {
      const response = await fetch('/api/web3-channels')
      if (!response.ok) throw new Error('Failed to fetch channels')
      return response.json()
    },
    enabled: !!id
  })

  // Fetch token data from external API
  const { data: tokenData } = useQuery({
    queryKey: ['/api/token-data', id],
    queryFn: async () => {
      const channel = channelsData.find((c: any) => c.id === id)
      if (!channel?.coinAddress) return null
      
      try {
        // Try to fetch real token data
        const [holdersRes, creationRes] = await Promise.all([
          fetch('/api/token-holders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenAddress: channel.coinAddress })
          }),
          fetch('/api/token-creation-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenAddress: channel.coinAddress })
          })
        ])

        const [holdersData, creationData] = await Promise.all([
          holdersRes.ok ? holdersRes.json() : { holderCount: 0 },
          creationRes.ok ? creationRes.json() : null
        ])

        return {
          price: '0.000001',
          marketCap: '0.00',
          volume24h: '0.00',
          holders: holdersData.holderCount || 0,
          change24h: 0,
          creationTime: creationData?.creationTime
        }
      } catch (error) {
        return {
          price: '0.000001',
          marketCap: '0.00', 
          volume24h: '0.00',
          holders: 0,
          change24h: 0
        }
      }
    },
    enabled: !!channelsData.length && !!id
  })

  // Find the specific channel and transform data
  const channel = channelsData.find((c: any) => c.id === id)
  const transformedChannel = channel ? {
    ...channel,
    avatarUrl: channel.avatarUrl || (channel.avatarCid ? `https://gateway.pinata.cloud/ipfs/${channel.avatarCid}` : '/placeholder-avatar.png'),
    coverUrl: channel.coverUrl || (channel.coverCid ? `https://gateway.pinata.cloud/ipfs/${channel.coverCid}` : undefined)
  } : null

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-700 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-32 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!transformedChannel) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Channel not found</h1>
          <p className="text-gray-400 mb-4">The channel you're looking for doesn't exist.</p>
          <Link href="/tokens">
            <Button variant="outline">Go to Discovery</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center mb-4">
          <Link href="/tokens">
            <Button variant="ghost" size="sm" className="mr-3">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Channel Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Chart */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Market cap</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">${tokenData?.marketCap || '0.00'}</span>
                    <span className="text-green-500 text-sm font-medium">+{tokenData?.change24h || 0}%</span>
                  </div>
                </div>
              </div>
              
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-center space-x-4">
                {['1H', '1D', '1W', '1M', 'All'].map((period) => (
                  <button 
                    key={period}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Trading Interface */}
          <div className="space-y-4">
            {/* Token Info Header */}
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={transformedChannel.avatarUrl} />
                <AvatarFallback>{transformedChannel.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{transformedChannel.name}</h3>
                <p className="text-sm text-gray-400">{transformedChannel.ticker || transformedChannel.name.slice(0, 6)}</p>
              </div>
            </div>

            {/* Market Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Market Cap</p>
                <p className="font-semibold">${tokenData?.marketCap || '0.00'}</p>
              </div>
              <div>
                <p className="text-gray-400">24H Volume</p>
                <p className="font-semibold">${tokenData?.volume24h || '0.00'}</p>
              </div>
              <div>
                <p className="text-gray-400">Creator Earnings</p>
                <p className="font-semibold">$0.00</p>
              </div>
              <div>
                <p className="text-gray-400">Holders</p>
                <p className="font-semibold">{tokenData?.holders || 0}</p>
              </div>
            </div>

            {/* Buy/Sell Buttons */}
            <div className="flex space-x-2">
              <Button className="flex-1 bg-green-500 hover:bg-green-600 text-black font-semibold">
                Buy
              </Button>
              <Button variant="outline" className="flex-1">
                Sell
              </Button>
            </div>

            {/* Balance */}
            <div className="text-right">
              <p className="text-sm text-gray-400">Balance: <span className="text-white">0 ETH</span></p>
            </div>

            {/* Trading Input */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.000111"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="pr-16 bg-gray-900 border-gray-700 h-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-sm font-medium">ETH</span>
                </div>
              </div>

              {/* Quick amounts */}
              <div className="flex space-x-2">
                {['0.001 ETH', '0.01 ETH', '0.1 ETH', 'Max'].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 flex-1"
                    onClick={() => setTradeAmount(amount.replace(' ETH', ''))}
                  >
                    {amount}
                  </Button>
                ))}
              </div>

              {/* Comment */}
              <Textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-gray-900 border-gray-700 resize-none h-10"
              />

              {/* Buy Button */}
              <Button className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold h-10">
                Buy
              </Button>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  )
}
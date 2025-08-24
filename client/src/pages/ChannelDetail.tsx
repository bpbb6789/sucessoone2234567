import { useState } from 'react'
import { useParams, Link } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  marketCap?: string
  volume24h?: string
  creatorEarnings?: string
  price?: string
}

export default function ChannelDetail() {
  const { id } = useParams()
  const [tradeAmount, setTradeAmount] = useState('')
  const [comment, setComment] = useState('')
  const [activeTab, setActiveTab] = useState('comments')

  const { data: channel, isLoading } = useQuery<ChannelDetail>({
    queryKey: ['/api/web3-channels', id],
    enabled: !!id
  })

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-700 rounded-lg"></div>
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

  if (!channel) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Channel not found</h1>
          <p className="text-gray-400 mb-4">The channel you're looking for doesn't exist.</p>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-3">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Channel Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Image/Content */}
          <div className="space-y-4">
            <div className="relative">
              <img
                src={channel.coverUrl || channel.avatarUrl}
                alt={channel.name}
                className="w-full aspect-square object-cover rounded-lg"
              />
              <div className="absolute bottom-4 left-4 flex space-x-2">
                <Button variant="ghost" size="sm" className="bg-black/50 hover:bg-black/70">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="bg-black/50 hover:bg-black/70">
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="bg-black/50 hover:bg-black/70">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="bg-black/50 hover:bg-black/70">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right side - Trading Interface */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={channel.avatarUrl} />
                  <AvatarFallback>{channel.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{channel.owner.slice(0, 6)}...{channel.owner.slice(-4)}</p>
                  <p className="text-sm text-gray-400">{formatTimeAgo(new Date(channel.createdAt))}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold">{channel.name}</h2>

            {/* Market Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-400">Market Cap</p>
                <p className="text-lg font-semibold text-green-500">
                  ${channel.marketCap || '757.53'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">24H Volume</p>
                <p className="text-lg font-semibold">${channel.volume24h || '2.30'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Creator Earnings</p>
                <p className="text-lg font-semibold">${channel.creatorEarnings || '0.02'}</p>
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
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.000111"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="pr-16 bg-gray-900 border-gray-700"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
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
                    className="text-xs"
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
                className="bg-gray-900 border-gray-700 resize-none h-12"
              />

              {/* Buy Button */}
              <Button className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3">
                Buy
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-900">
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="holders">
                Holders <Badge variant="secondary" className="ml-1">3</Badge>
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-center py-8">
                    No comments yet. Be the first to comment!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="holders" className="mt-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>Token Holders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-center py-8">
                    Holder information will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>Trading Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-center py-8">
                    Recent trading activity will be shown here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>Channel Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Token Symbol</p>
                      <p className="font-medium">{channel.ticker}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Category</p>
                      <Badge className="bg-green-500 text-black">{channel.category}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Contract Address</p>
                      <p className="font-mono text-sm break-all">{channel.coinAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Network</p>
                      <p className="font-medium">{channel.chainId === 8453 ? 'Base' : 'Base Sepolia'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="font-medium">{new Date(channel.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useParams, Link } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Settings, Bell, BellRing, Play, Users, Video, Grid3X3, Music, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import TradingModal from '@/components/TradingModal'

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
  slug: string
}

export default function ChannelDetail() {
  const { slug } = useParams()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [marketCap, setMarketCap] = useState<string>('Loading...')

  // Fetch real videos and content data
  const { data: channelContent } = useQuery({
    queryKey: ['/api/channel-content', slug],
    queryFn: async () => {
      const response = await fetch(`/api/channel-content/${slug}`)
      if (!response.ok) return { videos: [], shorts: [], stats: null }
      return response.json()
    },
    enabled: !!slug
  })

  const { data: channel, isLoading, error } = useQuery({
    queryKey: ['/api/web3-channels/slug', slug],
    queryFn: async () => {
      const response = await fetch(`/api/web3-channels/slug/${slug}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Channel not found')
        }
        throw new Error('Failed to fetch channel')
      }
      return response.json()
    },
    enabled: !!slug
  })

  // Get real subscriber count and video count
  const subscriberCount = channelContent?.stats?.subscriberCount || 0
  const videoCount = channelContent?.videos?.length || 0
  const shortsCount = channelContent?.shorts?.length || 0

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Fetch real market cap data
  useEffect(() => {
    const fetchMarketCap = async () => {
      if (!channel?.coinAddress) return
      
      try {
        const response = await fetch('https://unipump-contracts.onrender.com/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetTokenData($tokenAddress: String!) {
                minBuckets(
                  where: { tokenAddress: $tokenAddress }
                  orderBy: { id: desc }
                  first: 1
                ) {
                  items {
                    close
                    average
                  }
                }
                uniPumpCreatorSaless(
                  where: { memeTokenAddress: $tokenAddress }
                ) {
                  items {
                    totalSupply
                  }
                }
              }
            `,
            variables: { tokenAddress: channel.coinAddress }
          })
        })

        if (response.ok) {
          const data = await response.json()
          const priceData = data.data?.minBuckets?.items?.[0]
          const tokenData = data.data?.uniPumpCreatorSaless?.items?.[0]

          if (priceData && tokenData) {
            const price = parseFloat(priceData.close || priceData.average || '0')
            const totalSupply = parseFloat(tokenData.totalSupply || '1000000000')
            const calculatedMarketCap = price * Math.min(totalSupply, 800000000) // Max 800M circulating
            
            if (calculatedMarketCap >= 1000000) {
              setMarketCap(`$${(calculatedMarketCap / 1000000).toFixed(2)}M`)
            } else if (calculatedMarketCap >= 1000) {
              setMarketCap(`$${(calculatedMarketCap / 1000).toFixed(2)}K`)
            } else {
              setMarketCap(`$${calculatedMarketCap.toFixed(2)}`)
            }
          } else {
            setMarketCap('$0.00')
          }
        } else {
          setMarketCap('$0.00')
        }
      } catch (error) {
        console.error('Error fetching market cap:', error)
        setMarketCap('$0.00')
      }
    }

    fetchMarketCap()
  }, [channel?.coinAddress])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse p-4">
          <div className="h-8 bg-muted rounded w-32 mb-4"></div>
          <div className="h-48 bg-muted rounded mb-4"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-muted rounded-full"></div>
            <div>
              <div className="h-6 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-32 mb-2"></div>
              <div className="h-4 bg-muted rounded w-64"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-video bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Channel not found</h1>
          <p className="text-muted-foreground mb-4">The channel you're looking for doesn't exist.</p>
          <Link href="/contentcoin">
            <Button variant="outline">Go to Discovery</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Channel Banner with Header Controls */}
        <div className="aspect-[6/1] bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
          {channel.coverUrl && (
            <img 
              src={channel.coverUrl} 
              alt={`${channel.name} banner`}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Header Controls Overlay */}
          <div className="absolute top-0 left-0 right-0 z-50">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/contentcoin">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <h1 className="text-lg font-semibold text-white">{channel.name}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Info */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex gap-4">
              <Avatar className="w-20 h-20 md:w-32 md:h-32 border-4 border-background shadow-lg">
                <AvatarImage src={channel.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl md:text-4xl font-bold">
                  {channel.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 md:hidden">
                <h2 className="text-2xl font-bold mb-1">{channel.name}</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>@{channel.slug}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{formatNumber(subscriberCount)} subscribers</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      <span>{videoCount} posts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 hidden md:block">
              <h2 className="text-3xl font-bold mb-2">{channel.name}</h2>
              <div className="text-muted-foreground mb-2 flex items-center gap-2 flex-wrap">
                <span>@{channel.slug}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{formatNumber(subscriberCount)} subscribers</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  <span>{videoCount} posts</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <a 
                    href={`https://basescan.org/address/${channel.coinAddress}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <span className="text-xs">🔗</span>
                    <span>Basescan</span>
                  </a>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs">🎨</span>
                  <span>{channel.category}</span>
                </div>
              </div>
              {channel.description && (
                <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
                  {channel.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                size="lg"
                variant={isSubscribed ? "secondary" : "default"}
                onClick={() => setIsSubscribed(!isSubscribed)}
                className="min-w-[120px]"
                data-testid="button-subscribe"
              >
                {isSubscribed ? (
                  <>
                    <BellRing className="w-4 h-4 mr-2" />
                    Subscribed
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
              
              <div className="flex gap-2">
                <TradingModal
                  coinAddress={channel.coinAddress}
                  coinName={channel.name}
                  ticker={channel.ticker}
                >
                  <Button variant="outline" size="lg" className="min-w-[120px]">
                    Trade {channel.ticker}
                  </Button>
                </TradingModal>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="min-w-[120px]"
                  onClick={() => window.open(`https://basescan.org/address/${channel.coinAddress}`, '_blank')}
                >
                  {marketCap}
                </Button>
              </div>
            </div>
          </div>

          {/* Channel Description for Mobile */}
          {channel.description && (
            <div className="md:hidden mb-6">
              <p className="text-sm text-muted-foreground">
                {channel.description}
              </p>
            </div>
          )}

          

          {/* Content Tabs */}
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid grid-cols-5 w-full max-w-md">
              <TabsTrigger value="home" className="gap-2">
                <div className="w-4 h-4 rounded bg-current opacity-20"></div>
                Home
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Video className="w-4 h-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="shorts" className="gap-2">
                <Play className="w-4 h-4" />
                Shorts  
              </TabsTrigger>
              <TabsTrigger value="playlists" className="gap-2">
                <Music className="w-4 h-4" />
                Playlists
              </TabsTrigger>
              <TabsTrigger value="about" className="gap-2">
                <Users className="w-4 h-4" />
                About
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="mt-6">
              <div className="space-y-6">
                {/* Featured Video */}
                {channelContent?.videos && channelContent.videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Featured</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden group cursor-pointer">
                        <img 
                          src={channelContent.videos[0].thumbnail || "https://via.placeholder.com/320x180?text=No+Thumbnail"} 
                          alt={channelContent.videos[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-semibold">{channelContent.videos[0].title}</h4>
                        <p className="text-muted-foreground">{channelContent.videos[0].views || "0 views"} • {channelContent.videos[0].timeAgo || "Recently"}</p>
                        <p className="text-sm text-muted-foreground">
                          {channelContent.videos[0].description || channel.description || "No description available."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Posts */}
                {channelContent?.videos && channelContent.videos.length > 1 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent posts</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {channelContent.videos.slice(1).map((video) => (
                        <div key={video.id} className="group cursor-pointer">
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3 relative">
                            <img 
                              src={video.thumbnail || "https://via.placeholder.com/320x180?text=No+Thumbnail"} 
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {video.duration && (
                              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                                {video.duration}
                              </div>
                            )}
                          </div>
                          <h4 className="font-medium text-sm mb-1 line-clamp-2">{video.title}</h4>
                          <p className="text-xs text-muted-foreground">{video.views || "0 views"} • {video.timeAgo || "Recently"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No content message */}
                {(!channelContent?.videos || channelContent.videos.length === 0) && (
                  <div className="text-center py-12">
                    <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground">This channel hasn't uploaded any posts.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="videos" className="mt-6">
              {channelContent?.videos && channelContent.videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {channelContent.videos.map((video) => (
                    <div key={video.id} className="group cursor-pointer">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3 relative">
                        <img 
                          src={video.thumbnail || "https://via.placeholder.com/320x180?text=No+Thumbnail"} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {video.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                            {video.duration}
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">{video.title}</h4>
                      <p className="text-xs text-muted-foreground">{video.views || "0 views"} • {video.timeAgo || "Recently"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">This channel hasn't uploaded any posts.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="shorts" className="mt-6">
              {channelContent?.shorts && channelContent.shorts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {channelContent.shorts.map((short) => (
                    <div key={short.id} className="group cursor-pointer">
                      <div className="aspect-[9/16] bg-muted rounded-lg overflow-hidden mb-2">
                        <img 
                          src={short.thumbnail || "https://via.placeholder.com/180x320?text=No+Thumbnail"} 
                          alt={short.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="font-medium text-xs mb-1 line-clamp-2">{short.title}</h4>
                      <p className="text-xs text-muted-foreground">{short.views || "0 views"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No shorts yet</h3>
                  <p className="text-muted-foreground">This channel hasn't created any shorts.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlists" className="mt-6">
              <div className="text-center py-12">
                <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
                <p className="text-muted-foreground">This channel hasn't created any playlists.</p>
              </div>
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <div className="max-w-2xl space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Channel Details</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Description</div>
                      <div className="mt-1">
                        {channel.description || "No description available."}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Category</div>
                      <div className="mt-1">
                        <Badge variant="secondary">{channel.category}</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Channel Coin</div>
                      <div className="mt-1 font-mono text-sm">
                        {channel.ticker} • {channel.coinAddress}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Created</div>
                      <div className="mt-1">
                        {new Date(channel.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{formatNumber(subscriberCount)}</div>
                      <div className="text-sm text-muted-foreground">subscribers</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{videoCount}</div>
                      <div className="text-sm text-muted-foreground">posts</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { Heart, Eye, Share2, Play, FileImage, Music, FileText, Calendar, Filter, Search } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Link } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import type { ContentImport } from '@shared/schema'

const contentTypeIcons = {
  reel: Play,
  podcast: Music,
  image: FileImage,
  post: FileText,
  event: Calendar,
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')

  // Fetch all tokenized content from all channels
  const { data: allContent = [], isLoading } = useQuery({
    queryKey: ['/api/marketplace'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace')
      if (!response.ok) throw new Error('Failed to fetch marketplace content')
      return response.json() as Promise<ContentImport[]>
    }
  })

  // Filter and sort content
  const filteredContent = allContent
    .filter(content => {
      if (content.status !== 'tokenized') return false
      if (filterType !== 'all' && content.contentType !== filterType) return false
      if (searchQuery && !content.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(a.price || '0') - parseFloat(b.price || '0')
        case 'price-high':
          return parseFloat(b.price || '0') - parseFloat(a.price || '0')
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        default: // newest
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
    })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-300 rounded"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Content Marketplace</h1>
              <p className="text-sm text-muted-foreground">Discover and buy tokenized content</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-500">{filteredContent.length}</div>
              <div className="text-xs text-muted-foreground">Items Available</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="marketplace-search"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]" data-testid="filter-type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="reel">Reels</SelectItem>
                <SelectItem value="podcast">Podcasts</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="event">Events</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" data-testid="sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="container mx-auto px-4 py-6">
        {filteredContent.length === 0 ? (
          <div className="text-center py-16">
            <FileImage className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No content available</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No tokenized content available yet'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.map((content) => {
              const TypeIcon = contentTypeIcons[content.contentType as keyof typeof contentTypeIcons] || FileText
              
              return (
                <Card key={content.id} className="group hover:shadow-lg transition-all duration-200 border-2 border-green-100 dark:border-green-900" data-testid={`marketplace-card-${content.id}`}>
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-primary" />
                        <Badge variant="outline" className="text-xs capitalize">
                          {content.contentType}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                          Content Coin
                        </Badge>
                      </div>
                    </div>
                    
                    <Link to={`/content/${content.id}`}>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary cursor-pointer">
                        {content.title}
                      </h3>
                    </Link>
                    
                    {content.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {content.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-green-600">
                          {content.price || '0.001'} ETH
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {content.createdAt ? formatDistanceToNow(new Date(content.createdAt), { addSuffix: true }) : 'Unknown'}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          data-testid={`buy-${content.id}`}
                        >
                          <Heart className="w-3 h-3 mr-1" />
                          Buy Now
                        </Button>
                        
                        <Link to={`/content/${content.id}`}>
                          <Button size="sm" variant="outline" data-testid={`view-${content.id}`}>
                            <Eye className="w-3 h-3" />
                          </Button>
                        </Link>
                        
                        <Button size="sm" variant="outline" data-testid={`share-${content.id}`}>
                          <Share2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {content.ipfsCid && (
                        <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                          IPFS: {content.ipfsCid.slice(0, 12)}...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
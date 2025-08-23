import { useState } from 'react'
import { Eye, Heart, Share2, Download, ExternalLink, Calendar, User, Tag, Play, FileImage, Music, FileText, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useContentImports, useDeleteContentImport } from '@/hooks/useContentImports'
import { Link } from 'wouter'
import { formatDistanceToNow } from 'date-fns'

const contentTypeIcons = {
  reel: Play,
  podcast: Music,
  image: FileImage,
  post: FileText,
  event: Calendar,
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ready': return 'bg-green-500'
    case 'tokenizing': return 'bg-yellow-500'
    case 'tokenized': return 'bg-purple-500'
    case 'failed': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

export default function MyContent() {
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Use sample channel ID - this should come from user auth later
  const channelId = '57b556d8-23ca-4397-81ed-e5ee8afdd'
  
  const { data: allContent = [], isLoading } = useContentImports(channelId)
  const deleteMutation = useDeleteContentImport()
  
  // Filter and sort content
  const filteredContent = allContent
    .filter(content => {
      if (selectedType !== 'all' && content.contentType !== selectedType) return false
      if (searchQuery && !content.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        case 'name':
          return a.title.localeCompare(b.title)
        case 'type':
          return a.contentType.localeCompare(b.contentType)
        default: // newest
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
    })

  const statusCounts = {
    ready: allContent.filter(c => c.status === 'ready').length,
    tokenizing: allContent.filter(c => c.status === 'tokenizing').length,
    tokenized: allContent.filter(c => c.status === 'tokenized').length,
    failed: allContent.filter(c => c.status === 'failed').length,
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
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
              <h1 className="text-2xl font-bold">My Content</h1>
              <p className="text-sm text-muted-foreground">Manage your imported and tokenized content</p>
            </div>
            <Link to="/dashboard/import">
              <Button data-testid="import-more-button">
                Import More Content
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{statusCounts.ready}</div>
              <div className="text-xs text-muted-foreground">Ready</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{statusCounts.tokenized}</div>
              <div className="text-xs text-muted-foreground">Tokenized</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{statusCounts.tokenizing}</div>
              <div className="text-xs text-muted-foreground">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{allContent.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sm:max-w-sm"
              data-testid="search-content"
            />
            <Select value={selectedType} onValueChange={setSelectedType}>
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
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="type">By Type</SelectItem>
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
            <h3 className="text-lg font-semibold mb-2">No content found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedType !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Start by importing your first piece of content'
              }
            </p>
            <Link to="/dashboard/import">
              <Button>Import Content</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.map((content) => {
              const TypeIcon = contentTypeIcons[content.contentType as keyof typeof contentTypeIcons] || FileText
              
              return (
                <Card key={content.id} className="group hover:shadow-lg transition-all duration-200" data-testid={`content-card-${content.id}`}>
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-primary" />
                        <Badge variant="outline" className="text-xs capitalize">
                          {content.contentType}
                        </Badge>
                      </div>
                      <Badge 
                        className={`text-xs ${getStatusColor(content.status)} text-white px-2 py-1`}
                        data-testid={`status-${content.id}`}
                      >
                        {content.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0">
                    <Link to={`/content/${content.id}`}>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary cursor-pointer">
                        {content.title}
                      </h3>
                    </Link>
                    
                    {content.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {content.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {content.originalUrl && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate">
                            {new URL(content.originalUrl).hostname}
                          </span>
                        </div>
                      )}
                      
                      {content.ipfsCid && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Tag className="w-3 h-3" />
                          <span className="font-mono">
                            {content.ipfsCid.slice(0, 12)}...
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {content.createdAt ? formatDistanceToNow(new Date(content.createdAt), { addSuffix: true }) : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/content/${content.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-xs" data-testid={`view-${content.id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </Link>
                      
                      {content.status === 'tokenized' ? (
                        <Button 
                          size="sm" 
                          className="text-xs bg-green-600 hover:bg-green-700"
                          data-testid={`buy-${content.id}`}
                        >
                          Buy ${content.price || '0.001'} ETH
                        </Button>
                      ) : content.status === 'tokenizing' ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled 
                          className="text-xs"
                          data-testid={`minting-${content.id}`}
                        >
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Minting...
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDelete(content.id)}
                          className="text-xs"
                          data-testid={`delete-${content.id}`}
                        >
                          Delete
                        </Button>
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
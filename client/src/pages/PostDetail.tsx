import { useState } from 'react'
import { useParams, Link } from 'wouter'
import { ArrowLeft, Heart, MessageCircle, Share2, MoreHorizontal, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PostDetail {
  id: string
  title: string
  author: string
  avatarUrl: string
  imageUrl: string
  description: string
  type: 'reel' | 'content'
  createdAt: string
  likes: number
  views: number
  comments: number
}

// Mock data for demonstration
const mockPost: PostDetail = {
  id: '1',
  title: 'Amazing content creation',
  author: 'content_creator',
  avatarUrl: '/placeholder-avatar.png',
  imageUrl: '/placeholder-image.png',
  description: 'This is an amazing piece of content that showcases creativity and innovation.',
  type: 'reel',
  createdAt: '2024-01-15T10:30:00Z',
  likes: 1234,
  views: 5678,
  comments: 89
}

export default function PostDetail() {
  const { id, type } = useParams()
  const [comment, setComment] = useState('')
  const [activeTab, setActiveTab] = useState('comments')
  const [isLiked, setIsLiked] = useState(false)

  // In a real app, you would fetch the post data based on id and type
  const post = mockPost

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          url: window.location.href
        })
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const getPageTitle = () => {
    switch (type) {
      case 'reel': return 'Reel Details'
      case 'content': return 'Content Details'
      default: return 'Post Details'
    }
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
          <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Content */}
          <div className="space-y-4">
            <div className="relative">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full aspect-square object-cover rounded-lg"
              />
              {type === 'reel' && (
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button variant="ghost" size="lg" className="bg-black/50 hover:bg-black/70">
                    <Play className="w-8 h-8 text-white" fill="currentColor" />
                  </Button>
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-black/50 hover:bg-black/70"
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                </Button>
                <Button variant="ghost" size="sm" className="bg-black/50 hover:bg-black/70">
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-black/50 hover:bg-black/70"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="bg-black/50 hover:bg-black/70">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right side - Details and Interaction */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.avatarUrl} />
                  <AvatarFallback>{post.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{post.author}</p>
                  <p className="text-sm text-gray-400">{formatTimeAgo(new Date(post.createdAt))}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold">{post.title}</h2>

            {/* Description */}
            <p className="text-gray-300">{post.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-400">Likes</p>
                <p className="text-lg font-semibold text-red-500">
                  {post.likes + (isLiked ? 1 : 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Views</p>
                <p className="text-lg font-semibold">{post.views}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Comments</p>
                <p className="text-lg font-semibold">{post.comments}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button 
                className={`flex-1 font-semibold ${
                  isLiked 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                onClick={handleLike}
              >
                <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-white' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Comment Input */}
            <div className="space-y-4">
              <Textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-gray-900 border-gray-700 resize-none h-16"
              />
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold">
                Post Comment
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-900">
              <TabsTrigger value="comments">
                Comments <Badge variant="secondary" className="ml-1">{post.comments}</Badge>
              </TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
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

            <TabsContent value="related" className="mt-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>Related Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-center py-8">
                    Related {type}s will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>{type === 'reel' ? 'Reel' : 'Content'} Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Type</p>
                      <Badge className="bg-blue-500 text-white capitalize">{type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="font-medium">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Author</p>
                      <p className="font-medium">{post.author}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <Badge className="bg-green-500 text-black">Published</Badge>
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
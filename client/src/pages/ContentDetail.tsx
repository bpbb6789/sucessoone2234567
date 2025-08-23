import { useState } from 'react'
import { useParams, Link } from 'wouter'
import { useLocation } from 'wouter'
import { 
  ArrowLeft, Download, Share2, ExternalLink, Calendar, Tag, User, 
  Play, FileImage, Music, FileText, Loader2, Heart, Eye, MessageCircle,
  Copy, CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useContentImports, useTokenizeContent } from '@/hooks/useContentImports'
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

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  // Use sample channel ID - this should come from user auth later
  const channelId = '57b556d8-23ca-4397-81ed-e5ee8afdd'
  
  const { data: allContent = [], isLoading } = useContentImports(channelId)
  const tokenizeMutation = useTokenizeContent()
  
  const content = allContent.find(c => c.id === id)
  
  if (!id) {
    setLocation('/my-content')
    return null
  }

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard.`
      })
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive"
      })
    }
  }

  const handleTokenize = async () => {
    if (!content || content.status !== 'ready') return
    
    try {
      await tokenizeMutation.mutateAsync(content.id)
      toast({
        title: "Tokenization Started",
        description: "Your content is being tokenized. This may take a few moments."
      })
    } catch (error) {
      toast({
        title: "Tokenization Failed",
        description: error instanceof Error ? error.message : "Failed to start tokenization",
        variant: "destructive"
      })
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: content?.title || 'Content',
          url: url
        })
      } catch (error) {
        handleCopy(url, 'Link')
      }
    } else {
      handleCopy(url, 'Link')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="py-16">
              <FileImage className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Content Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The content you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/my-content">
                <Button>Go to My Content</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const TypeIcon = contentTypeIcons[content.contentType as keyof typeof contentTypeIcons] || FileText

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/my-content')}
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Content
            </Button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <TypeIcon className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-semibold truncate">{content.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare} data-testid="share-button">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              {content.status === 'ready' && (
                <Button 
                  size="sm" 
                  onClick={handleTokenize}
                  disabled={tokenizeMutation.isPending}
                  data-testid="tokenize-button"
                >
                  {tokenizeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Tokenizing...
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4 mr-2" />
                      Tokenize
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Content Status</CardTitle>
                <Badge 
                  className={`${getStatusColor(content.status)} text-white px-3 py-1`}
                  data-testid="content-status"
                >
                  {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Content Type</div>
                  <div className="font-medium capitalize">{content.contentType}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium">
                    {content.createdAt ? formatDistanceToNow(new Date(content.createdAt), { addSuffix: true }) : 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="font-medium">
                    {content.updatedAt ? formatDistanceToNow(new Date(content.updatedAt), { addSuffix: true }) : 'Unknown'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {content.title}
                </div>
              </div>

              {content.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                    {content.description}
                  </div>
                </div>
              )}

              {content.originalUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Original Source</label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                      {content.originalUrl}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(content.originalUrl!, 'Source URL')}
                      data-testid="copy-source-url"
                    >
                      {copiedField === 'Source URL' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(content.originalUrl!, '_blank')}
                      data-testid="open-source-url"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* IPFS Information */}
          {(content.ipfsCid || content.mediaCid || content.thumbnailCid) && (
            <Card>
              <CardHeader>
                <CardTitle>IPFS Storage</CardTitle>
                <CardDescription>
                  Your content is stored on IPFS (InterPlanetary File System) for decentralized access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {content.ipfsCid && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Content CID</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                        {content.ipfsCid}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(content.ipfsCid!, 'Content CID')}
                        data-testid="copy-content-cid"
                      >
                        {copiedField === 'Content CID' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${content.ipfsCid}`, '_blank')}
                        data-testid="view-ipfs-content"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {content.mediaCid && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Media CID</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                        {content.mediaCid}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(content.mediaCid!, 'Media CID')}
                        data-testid="copy-media-cid"
                      >
                        {copiedField === 'Media CID' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {content.thumbnailCid && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Thumbnail CID</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                        {content.thumbnailCid}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(content.thumbnailCid!, 'Thumbnail CID')}
                        data-testid="copy-thumbnail-cid"
                      >
                        {copiedField === 'Thumbnail CID' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {content.metadata && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(content.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {content.status === 'ready' && (
                  <Button 
                    onClick={handleTokenize}
                    disabled={tokenizeMutation.isPending}
                    data-testid="detail-tokenize-button"
                  >
                    {tokenizeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Tokenizing...
                      </>
                    ) : (
                      <>
                        <Tag className="w-4 h-4 mr-2" />
                        Tokenize Content
                      </>
                    )}
                  </Button>
                )}
                
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>

                {content.ipfsCid && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${content.ipfsCid}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on IPFS
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
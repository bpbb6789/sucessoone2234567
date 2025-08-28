import { useState } from 'react'
import { Upload, Link, FileImage, Video, Music, Calendar, FileText, Loader2, Trash2, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useContentImports, useFileUpload, useUrlImport, useTokenizeContent, useDeleteContentImport } from '@/hooks/useContentImports'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'

const contentTypes = [
  { id: 'reel', name: 'Reel', icon: Video, description: 'Short-form video content' },
  { id: 'podcast', name: 'Podcast', icon: Music, description: 'Audio content and episodes' },
  { id: 'image', name: 'Image', icon: FileImage, description: 'Photos and graphics' },
  { id: 'post', name: 'Post', icon: FileText, description: 'Text-based content' },
  { id: 'event', name: 'Event', icon: Calendar, description: 'Event information' },
]

export default function ContentImport() {
  const [selectedType, setSelectedType] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [coinName, setCoinName] = useState('')
  const [coinSymbol, setCoinSymbol] = useState('')
  const { toast } = useToast()
  const { address } = useAccount()
  
  // Get user's channel data
  const { data: userChannelData } = useQuery({
    queryKey: ["user-channel", address],
    queryFn: async () => {
      if (!address) return null;
      const response = await fetch(`/api/me`, {
        headers: { 'x-wallet-address': address }
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!address,
  });

  // Get user's Web3 channels
  const { data: userChannels = [] } = useQuery({
    queryKey: ["user-web3-channels", address],
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch('/api/web3-channels');
      if (!response.ok) return [];
      const allChannels = await response.json();
      return allChannels.filter((channel: any) => 
        channel.owner?.toLowerCase() === address.toLowerCase()
      );
    },
    enabled: !!address,
  });

  // Use the first Web3 channel if user has one, otherwise use 'public' for uploads
  const channelId = userChannels.length > 0 ? userChannels[0].id : 'public'
  
  // API hooks
  const { data: contentImports = [], isLoading, refetch } = useContentImports(channelId)
  const fileUploadMutation = useFileUpload()
  const urlImportMutation = useUrlImport()
  const tokenizeMutation = useTokenizeContent()
  const deleteMutation = useDeleteContentImport()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && selectedType && coinName && coinSymbol) {
      handleFileUpload(files, coinName, coinSymbol)
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in content type, coin name, and coin symbol first.",
        variant: "destructive"
      })
    }
  }

  const handleFileUpload = async (files: File[], coinName?: string, coinSymbol?: string) => {
    if (!selectedType) {
      toast({
        title: "Select Content Type", 
        description: "Please select a content type first.",
        variant: "destructive"
      })
      return
    }

    for (const file of files) {
      try {
        await fileUploadMutation.mutateAsync({
          file,
          channelId,
          contentType: selectedType,
          title: file.name,
          description: `Uploaded ${file.name}`,
          coinName: coinName || file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          coinSymbol: coinSymbol || file.name.slice(0, 6).toUpperCase().replace(/[^A-Z]/g, "") // Generate from filename
        })
        
        toast({
          title: "Upload Complete",
          description: `${file.name} has been uploaded to IPFS successfully.`
        })
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive"
        })
      }
    }
  }

  const handleUrlImport = async () => {
    if (!importUrl || !selectedType || !coinName || !coinSymbol) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields: content type, URL, coin name, and symbol.",
        variant: "destructive"
      })
      return
    }

    try {
      const hostname = new URL(importUrl).hostname
      
      // Show different loading messages for different content types
      const isReel = selectedType === 'reel'
      const loadingMessage = isReel 
        ? "Processing shorts content... Downloading and extracting thumbnail (5-10s)" 
        : "Importing content..."

      toast({
        title: "Import Started",
        description: loadingMessage
      })

      await urlImportMutation.mutateAsync({
        url: importUrl,
        channelId,
        contentType: selectedType,
        title: coinName || `Imported from ${hostname}`,
        description: `Content imported from ${importUrl}`,
        coinName,
        coinSymbol
      })
      
      setImportUrl('')
      toast({
        title: "Import Complete",
        description: isReel 
          ? "Short video has been processed and uploaded to IPFS successfully!" 
          : "Content has been imported and uploaded to IPFS successfully."
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to import content"
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleTokenize = async (id: string) => {
    try {
      await tokenizeMutation.mutateAsync(id)
      toast({
        title: "Tokenization Started",
        description: "Content tokenization has begun. This may take a few moments."
      })
    } catch (error) {
      toast({
        title: "Tokenization Failed",
        description: error instanceof Error ? error.message : "Failed to start tokenization",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast({
        title: "Content Deleted",
        description: "Content has been removed from your imports."
      })
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete content",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'bg-blue-500'
      case 'ready': return 'bg-green-500'
      case 'tokenizing': return 'bg-yellow-500'
      case 'tokenized': return 'bg-purple-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Uploading'
      case 'ready': return 'Ready'
      case 'tokenizing': return 'Tokenizing'
      case 'tokenized': return 'Tokenized'
      case 'failed': return 'Failed'
      default: return 'Unknown'
    }
  }

  // Content Preview Component
  const ContentPreview = ({ file }: { file: any }) => {
    const getIpfsUrl = (cid: string) => `https://gateway.pinata.cloud/ipfs/${cid}`

    switch (file.contentType) {
      case 'image':
        if (file.thumbnailCid || file.mediaCid || file.ipfsCid) {
          const imageCid = file.thumbnailCid || file.mediaCid || file.ipfsCid
          return (
            <div className="w-full h-20 bg-muted rounded overflow-hidden">
              <img 
                src={getIpfsUrl(imageCid)} 
                alt={file.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><FileImage class="w-6 h-6 text-muted-foreground" /></div>'
                }}
              />
            </div>
          )
        }
        break

      case 'reel':
        if (file.thumbnailCid || file.mediaCid) {
          const videoCid = file.thumbnailCid || file.mediaCid
          return (
            <div className="w-full h-20 bg-muted rounded overflow-hidden relative">
              {file.thumbnailCid ? (
                <img 
                  src={getIpfsUrl(file.thumbnailCid)} 
                  alt={file.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={getIpfsUrl(videoCid)} 
                  className="w-full h-full object-cover"
                  muted
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-6 h-6 text-white bg-black/50 rounded-full p-1" />
              </div>
            </div>
          )
        }
        break

      case 'podcast':
        return (
          <div className="w-full h-16 bg-muted rounded flex items-center justify-center p-3">
            <div className="flex items-center gap-2 w-full">
              <Music className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex gap-1">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-primary/30 rounded"
                      style={{ height: `${Math.random() * 16 + 4}px` }}
                    />
                  ))}
                </div>
              </div>
              <Play className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )

      case 'post':
        const excerpt = file.description || file.title || 'Text content'
        return (
          <div className="w-full p-3 bg-muted rounded">
            <FileText className="w-4 h-4 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {excerpt.slice(0, 80)}...
            </p>
          </div>
        )

      case 'event':
        return (
          <div className="w-full p-3 bg-muted rounded">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">{file.title}</p>
                <p className="text-xs text-muted-foreground">Event Details</p>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="w-full h-16 bg-muted rounded flex items-center justify-center">
            <FileImage className="w-6 h-6 text-muted-foreground" />
          </div>
        )
    }

    return (
      <div className="w-full h-16 bg-muted rounded flex items-center justify-center">
        <FileImage className="w-6 h-6 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Content Import</h1>
              <p className="text-xs text-muted-foreground">Transform content into tokenizable IPFS assets</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Ready: {contentImports.filter(f => f.status === 'ready').length}</span>
              <span>Tokenized: {contentImports.filter(f => f.status === 'tokenized').length}</span>
              <span>Total: {contentImports.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Import Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Content Type Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">1. Select Content Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {contentTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <Card 
                        key={type.id}
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          selectedType === type.id 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedType(type.id)}
                        data-testid={`content-type-${type.id}`}
                      >
                        <CardContent className="p-3 text-center">
                          <Icon className="w-6 h-6 mx-auto mb-1 text-primary" />
                          <h3 className="font-medium text-xs">{type.name}</h3>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Coin Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Set Coin Details</CardTitle>
                <CardDescription className="text-xs">This content will become a tradable coin with bonding curve pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="coin-name" className="text-sm">Coin Name</Label>
                    <Input
                      id="coin-name"
                      placeholder="Epic Cooking Tutorial"
                      value={coinName}
                      onChange={(e) => setCoinName(e.target.value)}
                      data-testid="coin-name-input"
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Full name for your content coin</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="coin-symbol" className="text-sm">Coin Symbol</Label>
                    <Input
                      id="coin-symbol"
                      placeholder="COOK"
                      value={coinSymbol}
                      onChange={(e) => setCoinSymbol(e.target.value.toUpperCase())}
                      maxLength={10}
                      data-testid="coin-symbol-input"
                      className="text-sm font-mono"
                    />
                    <p className="text-xs text-muted-foreground">Trading symbol (3-10 characters)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Import Methods */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Import Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-3">
                    <TabsTrigger value="upload" className="text-sm">Upload Files</TabsTrigger>
                    <TabsTrigger value="url" className="text-sm">Import from URL</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-3">
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        isDragging 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                      } ${!selectedType ? 'opacity-50' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      data-testid="file-drop-zone"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <h3 className="text-sm font-medium mb-1">Drop files or browse</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {!selectedType ? 'Select a content type first' :
                         !coinName || !coinSymbol ? 'Set coin name and symbol first' :
                         selectedType === 'reel' ? `Upload short videos (under 90s) to create ${coinSymbol} coin` :
                         `Upload ${contentTypes.find(t => t.id === selectedType)?.name} files to create ${coinSymbol} coin`
                        }
                      </p>
                      <Input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0 && coinName && coinSymbol) {
                            handleFileUpload(files, coinName, coinSymbol)
                          } else if (!coinName || !coinSymbol) {
                            toast({
                              title: "Missing Information",
                              description: "Please set coin name and symbol first.",
                              variant: "destructive"
                            })
                          }
                        }}
                        disabled={!selectedType}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={!selectedType || !coinName || !coinSymbol}
                        data-testid="browse-files-button"
                      >
                        Browse Files
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-3">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="import-url" className="text-sm">Content URL</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="import-url"
                            placeholder="https://youtube.com/shorts/... or https://tiktok.com/@user/video/..."
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            disabled={!selectedType}
                            data-testid="import-url-input"
                            className="text-sm"
                          />
                          <Button 
                            size="sm"
                            onClick={handleUrlImport}
                            disabled={!selectedType || !importUrl || !coinName || !coinSymbol || urlImportMutation.isPending}
                            data-testid="import-url-button"
                          >
                            {urlImportMutation.isPending ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                {selectedType === 'reel' ? 'Processing...' : 'Importing...'}
                              </>
                            ) : (
                              <>
                                <Link className="w-3 h-3 mr-1" />
                                Import
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          YouTube Shorts
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-black rounded"></div>
                          TikTok
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
                          Instagram Reels
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          Twitter/X
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* File Manager Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Import Manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contentImports.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <FileImage className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">No content imported yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {contentImports.map((file) => (
                      <Card key={file.id} className="p-2">
                        <div className="space-y-2">
                          {/* Content Preview */}
                          <ContentPreview file={file} />
                          
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium truncate">{file.title}</h4>
                              <p className="text-xs text-muted-foreground capitalize">{file.contentType}</p>
                              {/* Coin Info */}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  ${file.coinSymbol}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{file.coinName}</span>
                              </div>
                            </div>
                            <Badge 
                              className={`text-xs ${getStatusColor(file.status)} text-white ml-1 px-1 py-0`}
                              data-testid={`status-${file.id}`}
                            >
                              {getStatusText(file.status)}
                            </Badge>
                          </div>
                          
                          {(fileUploadMutation.isPending || urlImportMutation.isPending) && (
                            <Progress value={50} className="h-1" />
                          )}
                          
                          {file.ipfsCid && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {file.ipfsCid.slice(0, 12)}...
                            </p>
                          )}
                          
                          <div className="flex gap-1">
                            {file.status === 'ready' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTokenize(file.id)}
                                className="text-xs h-6 px-2"
                                data-testid={`tokenize-${file.id}`}
                              >
                                Tokenize
                              </Button>
                            )}
                            
                            {file.status === 'tokenizing' && (
                              <Button size="sm" variant="outline" disabled className="text-xs h-6 px-2">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Minting...
                              </Button>
                            )}
                            
                            {file.status === 'tokenized' && (
                              <Badge variant="secondary" className="text-xs h-6">
                                ✓ NFT Minted
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
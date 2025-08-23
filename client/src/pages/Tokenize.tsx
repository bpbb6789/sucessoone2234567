
import { useState } from 'react'
import { Upload, Link, FileImage, Video, Music, Calendar, FileText, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

const contentTypes = [
  { id: 'reel', name: 'Reel', icon: Video, description: 'Short-form video content' },
  { id: 'podcast', name: 'Podcast', icon: Music, description: 'Audio content and episodes' },
  { id: 'image', name: 'Image', icon: FileImage, description: 'Photos and graphics' },
  { id: 'post', name: 'Post', icon: FileText, description: 'Text-based content' },
  { id: 'event', name: 'Event', icon: Calendar, description: 'Event information' },
]

interface ImportedContent {
  id: string
  title: string
  contentType: string
  status: 'uploading' | 'ready' | 'tokenizing' | 'tokenized' | 'failed'
  ipfsCid?: string
  mediaCid?: string
  file?: File
  url?: string
  progress: number
}

export default function Tokenize() {
  const [selectedType, setSelectedType] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importedContent, setImportedContent] = useState<ImportedContent[]>([])
  const { toast } = useToast()

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
    if (files.length > 0 && selectedType) {
      handleFileUpload(files)
    } else if (!selectedType) {
      toast({
        title: "Select Content Type",
        description: "Please select a content type before uploading files.",
        variant: "destructive"
      })
    }
  }

  const simulateUpload = async (item: ImportedContent): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          setImportedContent(prev => 
            prev.map(content => 
              content.id === item.id 
                ? { 
                    ...content, 
                    status: 'ready', 
                    progress: 100,
                    ipfsCid: `Qm${Math.random().toString(36).substring(2, 15)}`,
                    mediaCid: `Qm${Math.random().toString(36).substring(2, 15)}`
                  } 
                : content
            )
          )
          resolve()
        } else {
          setImportedContent(prev => 
            prev.map(content => 
              content.id === item.id 
                ? { ...content, progress }
                : content
            )
          )
        }
      }, 200)
    })
  }

  const handleFileUpload = async (files: File[]) => {
    if (!selectedType) {
      toast({
        title: "Select Content Type", 
        description: "Please select a content type first.",
        variant: "destructive"
      })
      return
    }

    for (const file of files) {
      const newItem: ImportedContent = {
        id: Math.random().toString(36).substring(2, 15),
        title: file.name,
        contentType: selectedType,
        status: 'uploading',
        file,
        progress: 0
      }

      setImportedContent(prev => [...prev, newItem])

      try {
        await simulateUpload(newItem)
        toast({
          title: "Upload Complete",
          description: `${file.name} has been uploaded to IPFS successfully.`
        })
      } catch (error) {
        setImportedContent(prev => 
          prev.map(content => 
            content.id === newItem.id 
              ? { ...content, status: 'failed' }
              : content
          )
        )
        toast({
          title: "Upload Failed",
          description: "Failed to upload file",
          variant: "destructive"
        })
      }
    }
  }

  const handleUrlImport = async () => {
    if (!importUrl || !selectedType) {
      toast({
        title: "Missing Information",
        description: "Please select a content type and enter a URL.",
        variant: "destructive"
      })
      return
    }

    try {
      const hostname = new URL(importUrl).hostname
      const newItem: ImportedContent = {
        id: Math.random().toString(36).substring(2, 15),
        title: `Imported from ${hostname}`,
        contentType: selectedType,
        status: 'uploading',
        url: importUrl,
        progress: 0
      }

      setImportedContent(prev => [...prev, newItem])
      await simulateUpload(newItem)
      
      setImportUrl('')
      toast({
        title: "Import Complete",
        description: "Content has been imported and uploaded to IPFS successfully."
      })
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import content",
        variant: "destructive"
      })
    }
  }

  const handleTokenize = async (id: string) => {
    setImportedContent(prev => 
      prev.map(content => 
        content.id === id 
          ? { ...content, status: 'tokenizing' }
          : content
      )
    )

    // Simulate tokenization process
    setTimeout(() => {
      setImportedContent(prev => 
        prev.map(content => 
          content.id === id 
            ? { ...content, status: 'tokenized' }
            : content
        )
      )
      toast({
        title: "Tokenization Complete",
        description: "Your content has been successfully tokenized as an NFT!"
      })
    }, 3000)

    toast({
      title: "Tokenization Started",
      description: "Content tokenization has begun. This may take a few moments."
    })
  }

  const handleDelete = (id: string) => {
    setImportedContent(prev => prev.filter(content => content.id !== id))
    toast({
      title: "Content Deleted",
      description: "Content has been removed from your imports."
    })
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tokenize Your Content</h1>
              <p className="text-sm text-muted-foreground">Transform your media into tokenizable IPFS assets and mint as NFTs</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Ready: {importedContent.filter(f => f.status === 'ready').length}</span>
              <span>Tokenized: {importedContent.filter(f => f.status === 'tokenized').length}</span>
              <span>Total: {importedContent.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Import Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How it works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">1. Upload Content</h3>
                    <p className="text-sm text-muted-foreground">Upload files or import from URLs</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <FileImage className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">2. Store on IPFS</h3>
                    <p className="text-sm text-muted-foreground">Content is stored permanently on IPFS</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Video className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">3. Mint as NFT</h3>
                    <p className="text-sm text-muted-foreground">Tokenize your content as an NFT</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Select Content Type</CardTitle>
                <CardDescription>Choose the type of content you want to tokenize</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                      >
                        <CardContent className="p-4 text-center">
                          <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h3 className="font-medium text-sm mb-1">{type.name}</h3>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Import Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Import Content</CardTitle>
                <CardDescription>Upload files or import from popular platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="upload">Upload Files</TabsTrigger>
                    <TabsTrigger value="url">Import from URL</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                      } ${!selectedType ? 'opacity-50' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Drop files here or click to browse</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {selectedType 
                          ? `Upload ${contentTypes.find(t => t.id === selectedType)?.name} files`
                          : 'Select a content type first'
                        }
                      </p>
                      <Input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0) handleFileUpload(files)
                        }}
                        disabled={!selectedType}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={!selectedType}
                      >
                        Browse Files
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="import-url">Content URL</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="import-url"
                            placeholder="https://youtube.com/watch?v=... or https://tiktok.com/@..."
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            disabled={!selectedType}
                          />
                          <Button 
                            onClick={handleUrlImport}
                            disabled={!selectedType || !importUrl}
                          >
                            <Link className="w-4 h-4 mr-2" />
                            Import
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded"></div>
                          YouTube
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-black rounded"></div>
                          TikTok
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          Spotify
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          Twitter
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Content Manager Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Manager</CardTitle>
                <CardDescription>Manage your imported content and tokenize</CardDescription>
              </CardHeader>
              <CardContent>
                {importedContent.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No content imported yet</p>
                    <p className="text-xs">Upload files or import from URLs to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {importedContent.map((item) => (
                      <Card key={item.id} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">{item.title}</h4>
                              <p className="text-xs text-muted-foreground capitalize">{item.contentType}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge 
                                className={`text-xs ${getStatusColor(item.status)} text-white px-2 py-1`}
                              >
                                {getStatusText(item.status)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {item.status === 'uploading' && (
                            <Progress value={item.progress} className="h-2" />
                          )}
                          
                          {item.ipfsCid && (
                            <p className="text-xs text-muted-foreground font-mono">
                              IPFS: {item.ipfsCid.slice(0, 12)}...
                            </p>
                          )}
                          
                          <div className="flex gap-1">
                            {item.status === 'ready' && (
                              <Button
                                size="sm"
                                onClick={() => handleTokenize(item.id)}
                                className="text-xs h-7 px-3"
                              >
                                Tokenize
                              </Button>
                            )}
                            
                            {item.status === 'tokenizing' && (
                              <Button size="sm" disabled className="text-xs h-7 px-3">
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                Minting...
                              </Button>
                            )}
                            
                            {item.status === 'tokenized' && (
                              <Badge variant="secondary" className="text-xs h-7">
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

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploaded:</span>
                    <span>{importedContent.filter(i => i.status !== 'uploading').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ready to Tokenize:</span>
                    <span>{importedContent.filter(i => i.status === 'ready').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tokenized:</span>
                    <span>{importedContent.filter(i => i.status === 'tokenized').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

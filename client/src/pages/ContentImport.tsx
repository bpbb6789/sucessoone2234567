import { useState } from 'react'
import { Upload, Link, FileImage, Video, Music, Calendar, FileText, Loader2 } from 'lucide-react'
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
  type: string
  status: 'uploading' | 'ready' | 'tokenizing' | 'tokenized' | 'failed'
  progress: number
  ipfsCid?: string
  createdAt: Date
}

export default function ContentImport() {
  const [selectedType, setSelectedType] = useState<string>('')
  const [importedFiles, setImportedFiles] = useState<ImportedContent[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [importUrl, setImportUrl] = useState('')
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
      const newFile: ImportedContent = {
        id: Math.random().toString(36).substr(2, 9),
        title: file.name,
        type: selectedType,
        status: 'uploading',
        progress: 0,
        createdAt: new Date()
      }

      setImportedFiles(prev => [...prev, newFile])

      // Simulate upload progress
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          
          setImportedFiles(prev => prev.map(f => 
            f.id === newFile.id 
              ? { ...f, status: 'ready', progress: 100, ipfsCid: `Qm${Math.random().toString(36).substr(2, 44)}` }
              : f
          ))
          
          toast({
            title: "Upload Complete",
            description: `${file.name} has been uploaded to IPFS successfully.`
          })
        } else {
          setImportedFiles(prev => prev.map(f => 
            f.id === newFile.id ? { ...f, progress } : f
          ))
        }
      }, 500)
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

    const newImport: ImportedContent = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Imported from ${new URL(importUrl).hostname}`,
      type: selectedType,
      status: 'uploading',
      progress: 0,
      createdAt: new Date()
    }

    setImportedFiles(prev => [...prev, newImport])
    setImportUrl('')

    // Simulate import process
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 25
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        
        setImportedFiles(prev => prev.map(f => 
          f.id === newImport.id 
            ? { ...f, status: 'ready', progress: 100, ipfsCid: `Qm${Math.random().toString(36).substr(2, 44)}` }
            : f
        ))
        
        toast({
          title: "Import Complete",
          description: "Content has been imported and uploaded to IPFS successfully."
        })
      } else {
        setImportedFiles(prev => prev.map(f => 
          f.id === newImport.id ? { ...f, progress } : f
        ))
      }
    }, 600)
  }

  const handleTokenize = (id: string) => {
    setImportedFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'tokenizing' } : f
    ))

    // Simulate tokenization
    setTimeout(() => {
      setImportedFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'tokenized' } : f
      ))
      
      toast({
        title: "Tokenization Complete",
        description: "Content has been minted as an NFT successfully."
      })
    }, 3000)
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
              <h1 className="text-2xl font-bold">Content Import Tool</h1>
              <p className="text-muted-foreground">Transform your content into tokenizable IPFS assets</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Ready: {importedFiles.filter(f => f.status === 'ready').length}</span>
              <span>Tokenized: {importedFiles.filter(f => f.status === 'tokenized').length}</span>
              <span>Total: {importedFiles.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Import Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>1. Select Content Type</CardTitle>
                <CardDescription>Choose the type of content you want to import</CardDescription>
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
                        data-testid={`content-type-${type.id}`}
                      >
                        <CardContent className="p-4 text-center">
                          <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h3 className="font-medium text-sm">{type.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
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
                <CardTitle>2. Import Content</CardTitle>
                <CardDescription>Upload files or import from URLs</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
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
                      data-testid="file-drop-zone"
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Drop files here or click to browse</h3>
                      <p className="text-muted-foreground mb-4">
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
                        data-testid="browse-files-button"
                      >
                        Browse Files
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="import-url">Content URL</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="import-url"
                            placeholder="https://youtube.com/watch?v=... or https://tiktok.com/..."
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            disabled={!selectedType}
                            data-testid="import-url-input"
                          />
                          <Button 
                            onClick={handleUrlImport}
                            disabled={!selectedType || !importUrl}
                            data-testid="import-url-button"
                          >
                            <Link className="w-4 h-4 mr-2" />
                            Import
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-red-500 rounded"></div>
                          YouTube
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-black rounded"></div>
                          TikTok
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          Spotify
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* File Manager Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Manager</CardTitle>
                <CardDescription>Track your imported content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {importedFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileImage className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No content imported yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {importedFiles.map((file) => (
                      <Card key={file.id} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">{file.title}</h4>
                              <p className="text-xs text-muted-foreground capitalize">{file.type}</p>
                            </div>
                            <Badge 
                              className={`text-xs ${getStatusColor(file.status)} text-white ml-2`}
                              data-testid={`status-${file.id}`}
                            >
                              {getStatusText(file.status)}
                            </Badge>
                          </div>
                          
                          {file.status === 'uploading' && (
                            <Progress value={file.progress} className="h-1" />
                          )}
                          
                          {file.ipfsCid && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {file.ipfsCid.slice(0, 12)}...
                            </p>
                          )}
                          
                          <div className="flex gap-2">
                            {file.status === 'ready' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTokenize(file.id)}
                                className="text-xs"
                                data-testid={`tokenize-${file.id}`}
                              >
                                Tokenize
                              </Button>
                            )}
                            
                            {file.status === 'tokenizing' && (
                              <Button size="sm" variant="outline" disabled className="text-xs">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Minting...
                              </Button>
                            )}
                            
                            {file.status === 'tokenized' && (
                              <Badge variant="secondary" className="text-xs">
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
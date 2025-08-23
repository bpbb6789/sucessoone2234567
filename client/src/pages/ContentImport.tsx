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
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Content Import</h1>
              <p className="text-xs text-muted-foreground">Transform content into tokenizable IPFS assets</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Ready: {importedFiles.filter(f => f.status === 'ready').length}</span>
              <span>Tokenized: {importedFiles.filter(f => f.status === 'tokenized').length}</span>
              <span>Total: {importedFiles.length}</span>
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

            {/* Import Methods */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Import Content</CardTitle>
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
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={!selectedType}
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
                            placeholder="https://youtube.com/watch?v=..."
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            disabled={!selectedType}
                            data-testid="import-url-input"
                            className="text-sm"
                          />
                          <Button 
                            size="sm"
                            onClick={handleUrlImport}
                            disabled={!selectedType || !importUrl}
                            data-testid="import-url-button"
                          >
                            <Link className="w-3 h-3 mr-1" />
                            Import
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          YouTube
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-black rounded"></div>
                          TikTok
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
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
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Import Manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {importedFiles.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <FileImage className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">No content imported yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {importedFiles.map((file) => (
                      <Card key={file.id} className="p-2">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium truncate">{file.title}</h4>
                              <p className="text-xs text-muted-foreground capitalize">{file.type}</p>
                            </div>
                            <Badge 
                              className={`text-xs ${getStatusColor(file.status)} text-white ml-1 px-1 py-0`}
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
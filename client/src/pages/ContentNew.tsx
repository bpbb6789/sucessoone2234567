import { useState } from 'react';
import { Upload, Link, FileImage, Video, Music, Palette, FileText, Loader2, Coins, Sparkles, ExternalLink, Camera, PlayCircle, Headphones, FileTextIcon, ImageIcon, Zap, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from '@/hooks/useWallet';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const contentTypes = [
  { 
    id: 'image', 
    name: 'Image', 
    icon: ImageIcon, 
    description: 'JPG, PNG, GIF, SVG images', 
    accept: 'image/*',
    maxSize: '50MB',
    examples: 'Art, photography, memes, digital collectibles',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950'
  },
  { 
    id: 'video', 
    name: 'Video', 
    icon: PlayCircle, 
    description: 'MP4, MOV, AVI videos', 
    accept: 'video/*',
    maxSize: '500MB',
    examples: 'Short films, tutorials, vlogs, content creator videos',
    color: 'text-red-500 bg-red-50 dark:bg-red-950'
  },
  { 
    id: 'audio', 
    name: 'Audio', 
    icon: Headphones, 
    description: 'MP3, WAV, FLAC audio files', 
    accept: 'audio/*',
    maxSize: '100MB',
    examples: 'Music tracks, podcasts, audio art, sound effects',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950'
  },
  { 
    id: 'gif', 
    name: 'Animation', 
    icon: Sparkles, 
    description: 'GIF, WebM animations', 
    accept: 'image/gif,video/webm',
    maxSize: '50MB',
    examples: 'Animated art, memes, motion graphics',
    color: 'text-green-500 bg-green-50 dark:bg-green-950'
  },
  { 
    id: 'document', 
    name: 'Document', 
    icon: FileTextIcon, 
    description: 'PDF, TXT documents', 
    accept: '.pdf,.txt',
    maxSize: '10MB',
    examples: 'Written content, ebooks, research papers, guides',
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950'
  },
];

const marketCapPresets = [
  { value: 'low', label: 'Low Market Cap ($1K)', k: '1000000000000', description: 'Lower starting price, accessible to everyone' },
  { value: 'medium', label: 'Medium Market Cap ($5K)', k: '5000000000000', description: 'Balanced pricing for quality content' },
  { value: 'high', label: 'High Market Cap ($10K)', k: '10000000000000', description: 'Premium pricing for exclusive content' },
];

interface FormData {
  contentType: string;
  tokenName: string;
  tokenSymbol: string;
  tokenSupply: string;
  description: string;
  marketCap: string;
  socialLinks: {
    twitter?: string;
    website?: string;
    discord?: string;
  };
}

export default function ContentNew() {
  const [step, setStep] = useState<'upload' | 'configure' | 'deploy' | 'success'>('upload');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [importUrl, setImportUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState<FormData>({
    contentType: '',
    tokenName: '',
    tokenSymbol: '',
    tokenSupply: '1000000',
    description: '',
    marketCap: 'medium',
    socialLinks: {}
  });

  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  // Upload content to IPFS
  const uploadContentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contentType', selectedType);
      return await fetch('/api/upload-content', {
        method: 'POST',
        body: formData
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Content Uploaded",
        description: "Your content has been uploaded to IPFS successfully!"
      });
      setStep('configure');
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload content. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Import content from URL
  const importContentMutation = useMutation({
    mutationFn: async (url: string) => {
      return await fetch('/api/import-content-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url,
          contentType: selectedType 
        })
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Content Imported",
        description: "Content has been imported from URL successfully!"
      });
      setStep('configure');
    }
  });

  // Deploy content coin
  const deployContentCoinMutation = useMutation({
    mutationFn: async (tokenData: FormData) => {
      return await fetch('/api/deploy-content-coin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tokenData,
          contentType: selectedType,
          creator: address
        })
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Content Token Created!",
        description: `Your ${formData.tokenName} token has been deployed successfully!`
      });
      setStep('success');
      queryClient.invalidateQueries({ queryKey: ['content-tokens'] });
    },
    onError: (error) => {
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy content token. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (file: File) => {
    if (file.size > getMaxFileSize(selectedType)) {
      toast({
        title: "File Too Large",
        description: `Maximum file size is ${getMaxSize(selectedType)}`,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Auto-populate token name from filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setFormData(prev => ({
      ...prev,
      tokenName: nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1)
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getMaxFileSize = (type: string): number => {
    const sizes: Record<string, number> = {
      'image': 50 * 1024 * 1024, // 50MB
      'video': 500 * 1024 * 1024, // 500MB
      'audio': 100 * 1024 * 1024, // 100MB
      'gif': 50 * 1024 * 1024, // 50MB
      'document': 10 * 1024 * 1024, // 10MB
    };
    return sizes[type] || 50 * 1024 * 1024;
  };

  const getMaxSize = (type: string): string => {
    const typeConfig = contentTypes.find(t => t.id === type);
    return typeConfig?.maxSize || '50MB';
  };

  const handleUploadContent = () => {
    if (selectedFile) {
      setIsProcessing(true);
      uploadContentMutation.mutate(selectedFile);
    }
  };

  const handleImportUrl = () => {
    if (importUrl) {
      setIsProcessing(true);
      importContentMutation.mutate(importUrl);
    }
  };

  const handleDeployToken = () => {
    if (!formData.tokenName || !formData.tokenSymbol) {
      toast({
        title: "Missing Information",
        description: "Please fill in token name and symbol.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    deployContentCoinMutation.mutate(formData);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Coins className="h-6 w-6 text-primary" />
              Create Content Token
            </CardTitle>
            <CardDescription>
              Connect your wallet to create and tokenize your content
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Content Token
          </h1>
          <p className="text-lg text-muted-foreground">
            Tokenize your content and create a tradeable asset with bonding curve pricing
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${step === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <Upload className="h-4 w-4" />
              <span className="text-sm font-medium">Upload</span>
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${step === 'configure' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <Coins className="h-4 w-4" />
              <span className="text-sm font-medium">Configure</span>
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${step === 'deploy' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Deploy</span>
            </div>
          </div>
        </div>

        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Content</CardTitle>
              <CardDescription>
                Choose your content type and upload files or import from URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload Files</TabsTrigger>
                  <TabsTrigger value="import">Import from URL</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-6">
                  {/* Content Type Selection */}
                  <div>
                    <Label className="text-base font-medium mb-4 block">Select Content Type</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contentTypes.map((type) => (
                        <Card 
                          key={type.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedType === type.id 
                              ? 'ring-2 ring-primary shadow-md' 
                              : 'hover:ring-1 hover:ring-primary/50'
                          }`}
                          onClick={() => setSelectedType(type.id)}
                          data-testid={`content-type-${type.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${type.color}`}>
                                <type.icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium">{type.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                                <div className="space-y-1">
                                  <Badge variant="outline" className="text-xs">Max {type.maxSize}</Badge>
                                  <p className="text-xs text-muted-foreground">{type.examples}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* File Upload Area */}
                  {selectedType && (
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                        isDragging 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      data-testid="file-upload-area"
                    >
                      <div className="text-center">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          Drop your {contentTypes.find(t => t.id === selectedType)?.name.toLowerCase()} here
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          or click to browse files
                        </p>
                        <input
                          type="file"
                          accept={contentTypes.find(t => t.id === selectedType)?.accept}
                          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                          className="hidden"
                          id="file-upload"
                          data-testid="file-input"
                        />
                        <Button 
                          onClick={() => document.getElementById('file-upload')?.click()}
                          variant="outline"
                          data-testid="browse-files-button"
                        >
                          Browse Files
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* File Preview */}
                  {selectedFile && previewUrl && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                            {selectedType === 'image' && (
                              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            {selectedType === 'video' && (
                              <video src={previewUrl} className="w-full h-full object-cover" />
                            )}
                            {selectedType === 'audio' && (
                              <Headphones className="h-8 w-8 text-muted-foreground" />
                            )}
                            {(selectedType === 'document' || selectedType === 'gif') && (
                              <FileTextIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{selectedFile.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button 
                            onClick={handleUploadContent}
                            disabled={isProcessing}
                            data-testid="upload-content-button"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Content
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="import" className="space-y-6">
                  {/* Content Type Selection for Import */}
                  <div>
                    <Label className="text-base font-medium mb-4 block">Select Content Type</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contentTypes.map((type) => (
                        <Card 
                          key={type.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedType === type.id 
                              ? 'ring-2 ring-primary shadow-md' 
                              : 'hover:ring-1 hover:ring-primary/50'
                          }`}
                          onClick={() => setSelectedType(type.id)}
                          data-testid={`import-content-type-${type.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${type.color}`}>
                                <type.icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium">{type.name}</h3>
                                <p className="text-sm text-muted-foreground">{type.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* URL Import */}
                  {selectedType && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="import-url">Content URL</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="import-url"
                            type="url"
                            placeholder="https://example.com/content.jpg"
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            data-testid="import-url-input"
                          />
                          <Button 
                            onClick={handleImportUrl}
                            disabled={!importUrl || isProcessing}
                            data-testid="import-url-button"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Link className="h-4 w-4 mr-2" />
                                Import
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Supported Sources</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Direct file URLs (JPG, PNG, MP4, etc.)</li>
                          <li>• YouTube Shorts, TikTok, Instagram Reels</li>
                          <li>• Social media content links</li>
                          <li>• IPFS and decentralized storage links</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {step === 'configure' && (
          <Card>
            <CardHeader>
              <CardTitle>Configure Your Token</CardTitle>
              <CardDescription>
                Set up your content token details and bonding curve parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="token-name">Token Name</Label>
                    <Input
                      id="token-name"
                      placeholder="My Amazing Content"
                      value={formData.tokenName}
                      onChange={(e) => setFormData(prev => ({ ...prev, tokenName: e.target.value }))}
                      data-testid="token-name-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="token-symbol">Token Symbol</Label>
                    <Input
                      id="token-symbol"
                      placeholder="MAC"
                      value={formData.tokenSymbol}
                      onChange={(e) => setFormData(prev => ({ ...prev, tokenSymbol: e.target.value.toUpperCase() }))}
                      data-testid="token-symbol-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="token-supply">Total Supply</Label>
                    <Input
                      id="token-supply"
                      type="number"
                      placeholder="1000000"
                      value={formData.tokenSupply}
                      onChange={(e) => setFormData(prev => ({ ...prev, tokenSupply: e.target.value }))}
                      data-testid="token-supply-input"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="market-cap">Market Cap Setting</Label>
                    <Select 
                      value={formData.marketCap} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, marketCap: value }))}
                    >
                      <SelectTrigger data-testid="market-cap-select">
                        <SelectValue placeholder="Select market cap" />
                      </SelectTrigger>
                      <SelectContent>
                        {marketCapPresets.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            <div>
                              <div className="font-medium">{preset.label}</div>
                              <div className="text-sm text-muted-foreground">{preset.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your content and what makes it special..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      data-testid="description-textarea"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Social Links (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      placeholder="https://twitter.com/username"
                      value={formData.socialLinks.twitter || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                      }))}
                      data-testid="twitter-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://yourwebsite.com"
                      value={formData.socialLinks.website || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        socialLinks: { ...prev.socialLinks, website: e.target.value }
                      }))}
                      data-testid="website-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discord">Discord</Label>
                    <Input
                      id="discord"
                      placeholder="https://discord.gg/invite"
                      value={formData.socialLinks.discord || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        socialLinks: { ...prev.socialLinks, discord: e.target.value }
                      }))}
                      data-testid="discord-input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('upload')}
                  data-testid="back-button"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleDeployToken}
                  disabled={!formData.tokenName || !formData.tokenSymbol || isProcessing}
                  className="flex-1"
                  data-testid="deploy-token-button"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deploying Token...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Deploy Content Token
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'success' && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Content Token Created Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Your {formData.tokenName} ({formData.tokenSymbol}) token has been deployed and is ready for trading.
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => setLocation('/explorecontent')}
                  data-testid="explore-content-button"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Explore Content Tokens
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep('upload');
                    setSelectedFile(null);
                    setPreviewUrl('');
                    setSelectedType('');
                    setFormData({
                      contentType: '',
                      tokenName: '',
                      tokenSymbol: '',
                      tokenSupply: '1000000',
                      description: '',
                      marketCap: 'medium',
                      socialLinks: {}
                    });
                  }}
                  data-testid="create-another-button"
                >
                  Create Another Token
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
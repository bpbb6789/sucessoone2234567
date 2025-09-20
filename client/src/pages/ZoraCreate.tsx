
"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccount } from 'wagmi';
import { Loader2, Rocket, Upload, X, FileImage, Video, Music, FileText, ExternalLink } from 'lucide-react';
import CreateChannel from '@/components/CreateChannel';
import { useUrlImport } from '@/hooks/useContentImports';
import { useToast } from '@/hooks/use-toast';

const currencies = [
  { value: 'ETH', label: 'ETH' },
  { value: 'ZORA', label: 'ZORA' },
];

const marketCaps = [
  { value: 'LOW', label: 'Low (~$1K)' },
  { value: 'HIGH', label: 'High (~$10K)' },
];

export default function ZoraCreate() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('token');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    imageUri: '',
    twitter: '',
    discord: '',
    website: '',
    currency: 'ETH',
    startingMarketCap: 'LOW'
  });

  const urlImportMutation = useUrlImport();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Media upload functions
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

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image, video, or audio file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 50MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setFormData(prev => ({ ...prev, imageUri: '' }));
  };

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) return FileImage;
    if (file.type.startsWith('video/')) return Video;
    if (file.type.startsWith('audio/')) return Music;
    return FileText;
  };

  const uploadMediaToIPFS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload-media', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload media to IPFS');
    }

    const result = await response.json();
    return `https://gateway.pinata.cloud/ipfs/${result.cid}`;
  };

  const handleUrlImport = async () => {
    if (!importUrl || !formData.name || !formData.symbol) {
      toast({
        title: "Missing Information",
        description: "Please fill in URL, token name, and symbol.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Import Started",
        description: "Processing content..."
      });

      const result = await urlImportMutation.mutateAsync({
        url: importUrl,
        channelId: 'public',
        contentType: 'reel',
        title: formData.name,
        description: formData.description || `Content imported from ${importUrl}`,
        coinName: formData.name,
        coinSymbol: formData.symbol
      });

      setImportUrl('');
      toast({
        title: "Import Complete",
        description: "Content processed successfully!"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to import content";
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleCreateToken = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to create a token",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.symbol) {
      toast({
        title: "Missing Information",
        description: "Please fill in token name and symbol",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let finalImageUri = formData.imageUri;

      if (selectedFile) {
        setIsUploading(true);
        toast({
          title: "Uploading Media...",
          description: "Uploading your token asset to IPFS",
        });

        try {
          finalImageUri = await uploadMediaToIPFS(selectedFile);
          setFormData(prev => ({ ...prev, imageUri: finalImageUri }));
        } catch (uploadError) {
          console.error('Media upload failed:', uploadError);
          toast({
            title: "Upload Failed",
            description: "Failed to upload media. Continuing without asset.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }

      toast({
        title: "Creating Token...",
        description: "Your token is being deployed",
      });

      const metadata = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        imageUri: finalImageUri,
        social: {
          twitter: formData.twitter,
          discord: formData.discord,
          website: formData.website
        },
        currency: formData.currency,
        startingMarketCap: formData.startingMarketCap
      };

      const response = await fetch('/api/creator-coins/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...metadata,
          creatorAddress: address,
          contentType: 'token',
          mediaCid: selectedFile ? 'uploaded' : 'none',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create token: ${errorData}`);
      }

      const result = await response.json();

      toast({
        title: "Token Created! 🚀",
        description: `${formData.name} (${formData.symbol}) deployed successfully!`,
      });

      // Reset form
      setFormData({
        name: '',
        symbol: '',
        description: '',
        imageUri: '',
        twitter: '',
        discord: '',
        website: '',
        currency: 'ETH',
        startingMarketCap: 'LOW'
      });
      removeSelectedFile();

      if (result.coinAddress) {
        setTimeout(() => {
          window.location.href = `/zora-token/${result.coinAddress}`;
        }, 2000);
      }

    } catch (error) {
      console.error('Error creating token:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Launch Your Token
          </h1>
          <p className="text-muted-foreground">
            Create tokens with Zora's bonding curve technology
          </p>
        </div>

        <Tabs defaultValue="token" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="token">Create Token</TabsTrigger>
            <TabsTrigger value="import">Import Content</TabsTrigger>
            <TabsTrigger value="channel">Create Channel</TabsTrigger>
          </TabsList>

          <TabsContent value="token" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Token Details</CardTitle>
                <CardDescription>Create your token with custom settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Token Name *</Label>
                    <Input
                      id="name"
                      placeholder="My Token"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol *</Label>
                    <Input
                      id="symbol"
                      placeholder="MTK"
                      value={formData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your token..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Simple Media Upload */}
                <div className="space-y-3">
                  <Label>Token Image/Media</Label>
                  
                  {!selectedFile ? (
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragging 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('media-upload')?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium">Upload asset or drag and drop</p>
                      <p className="text-xs text-muted-foreground">Images, videos, audio (max 50MB)</p>
                      <input
                        id="media-upload"
                        type="file"
                        className="hidden"
                        accept="image/*,video/*,audio/*"
                        onChange={handleFileInput}
                        disabled={!isConnected}
                      />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const IconComponent = getFileTypeIcon(selectedFile);
                            return <IconComponent className="h-4 w-4 text-purple-500" />;
                          })()}
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeSelectedFile}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {selectedFile.type.startsWith('image/') && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="imageUri">Or paste image URL</Label>
                    <Input
                      id="imageUri"
                      placeholder="https://example.com/image.png"
                      value={formData.imageUri}
                      onChange={(e) => handleInputChange('imageUri', e.target.value)}
                      disabled={!!selectedFile}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Market Cap</Label>
                    <Select value={formData.startingMarketCap} onValueChange={(value) => handleInputChange('startingMarketCap', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {marketCaps.map(cap => (
                          <SelectItem key={cap.value} value={cap.value}>
                            {cap.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Content</CardTitle>
                <CardDescription>Import videos from social platforms and tokenize them</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="import-url">Content URL *</Label>
                  <Input
                    placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    disabled={!isConnected}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Token Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Content Token"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Symbol *</Label>
                    <Input
                      value={formData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      placeholder="CTK"
                      maxLength={6}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleUrlImport}
                  disabled={!isConnected || !importUrl.trim() || urlImportMutation.isPending}
                  className="w-full"
                >
                  {urlImportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Import & Create Token
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Channel</CardTitle>
                <CardDescription>Deploy a channel with tokenomics</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateChannel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Button */}
        <div className="mt-8 text-center">
          {!isConnected ? (
            <div>
              <p className="text-muted-foreground mb-4">Connect your wallet to get started</p>
              <Button onClick={() => {}}>
                Connect Wallet
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleCreateToken}
              disabled={isLoading || isUploading || !formData.name || !formData.symbol}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  Create Token
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

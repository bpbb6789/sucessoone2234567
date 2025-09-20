"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccount } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { Loader2, Coins, Zap, Rocket, Info, ExternalLink, CheckCircle, AlertCircle, Upload, X, FileImage, Video, Music, FileText, Play } from 'lucide-react';
import CreateChannel from '@/components/CreateChannel';
import { useUrlImport } from '@/hooks/useContentImports';
import { useMutation } from '@tanstack/react-query';
import { useTriggerNotification } from "@/hooks/useNotifications";
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { zoraFactoryImplAbi } from '@/lib/contracts';

const currencies = [
  { value: 'ETH', label: 'ETH', description: 'Ethereum' },
  { value: 'ZORA', label: 'ZORA', description: 'Zora Protocol Token' },
];

const marketCaps = [
  { value: 'LOW', label: 'Low Market Cap', description: 'Starting at ~$1K market cap' },
  { value: 'HIGH', label: 'High Market Cap', description: 'Starting at ~$10K market cap' },
];

// Your deployed Zora Factory contract address on Base Sepolia
const ZORA_FACTORY_ADDRESS = "0xAe028301c7822F2c254A43451D22dB5Fe447a4a0" as Address;

export default function ZoraCreate() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Import Shorts state
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

  const [deployedTokenAddress, setDeployedTokenAddress] = useState<Address | null>(null);

  // Import Shorts hooks
  const urlImportMutation = useUrlImport();
  const triggerNotification = useTriggerNotification();

  // Get user's channel data for imports
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

  // Get user's Web3 channels for imports
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

  // Use the first Web3 channel if user has one, otherwise use 'public' for imports
  const channelId = userChannels.length > 0 ? userChannels[0].id : 'public';

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
    // Validate file type
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

    // Validate file size (50MB limit)
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
      const hostname = new URL(importUrl).hostname;

      toast({
        title: "Import Started",
        description: "Processing shorts content... Downloading and extracting thumbnail (5-10s)"
      });

      const result = await urlImportMutation.mutateAsync({
        url: importUrl,
        channelId,
        contentType: 'reel',
        title: formData.name,
        description: formData.description || `Content imported from ${importUrl}`,
        coinName: formData.name,
        coinSymbol: formData.symbol
      });

      // Reset form after successful import
      setImportUrl('');
      toast({
        title: "Import Complete",
        description: "Short video has been processed and is ready for tokenization!"
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
        description: "Please fill in at least the token name and symbol",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let finalImageUri = formData.imageUri;

      // Upload media file if selected
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
        description: "Your Zora token is being deployed to the blockchain",
      });

      // Create metadata object
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

      // Call your backend API to create the Zora coin
      const response = await fetch('/api/creator-coins/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...metadata,
          creatorAddress: address,
          contentType: 'token', // This is a token creation, not content
          mediaCid: selectedFile ? 'uploaded' : 'none',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create token: ${errorData}`);
      }

      const result = await response.json();

      toast({
        title: "Token Created Successfully! 🚀",
        description: `${formData.name} (${formData.symbol}) deployed with ${selectedFile ? 'custom asset' : 'default icon'}!`,
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

      // Redirect to explore page or token detail
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
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-10 w-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Zora Create
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deploy your token using Zora's advanced bonding curve technology with automatic liquidity and trading
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Powered by Zora Factory
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  Your token will be deployed using Zora's battle-tested factory contracts with built-in bonding curves, 
                  automatic Uniswap V4 integration, and creator rewards. No coding required!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Basic Token
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Creator Coin
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Import Shorts
            </TabsTrigger>
            <TabsTrigger value="channel" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Create Channel
            </TabsTrigger>
          </TabsList></TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Basic Token</CardTitle>
                <CardDescription>
                  Deploy a standard ERC-20 token with Zora bonding curve mechanics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Token Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Token Name *</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome Token"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symbol">Token Symbol *</Label>
                    <Input
                      id="symbol"
                      placeholder="MAT"
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
                    placeholder="Describe your token and its purpose..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Media Upload Section */}
                <div className="space-y-4">
                  <Label>Token Asset (Image, Video, Audio)</Label>
                  
                  {!selectedFile ? (
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                        isDragging 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('media-upload')?.click()}
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm font-medium">Drop your asset here or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports: JPG, PNG, GIF, SVG, MP4, MOV, MP3, WAV (max 50MB)
                        </p>
                      </div>
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
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const IconComponent = getFileTypeIcon(selectedFile);
                            return <IconComponent className="h-5 w-5 text-purple-500" />;
                          })()}
                          <div>
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
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
                      
                      {/* Media Preview */}
                      {selectedFile.type.startsWith('image/') && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {selectedFile.type.startsWith('video/') && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <video src={previewUrl} className="w-full h-full object-cover" controls />
                        </div>
                      )}
                      {selectedFile.type.startsWith('audio/') && (
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <Music className="h-8 w-8 text-purple-500" />
                            <div>
                              <p className="font-medium">Audio Preview</p>
                              <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                            </div>
                          </div>
                          <audio src={previewUrl} controls className="w-full" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual URL Input (Alternative) */}
                  <div className="space-y-2">
                    <Label htmlFor="imageUri">Or paste image URL directly</Label>
                    <Input
                      id="imageUri"
                      placeholder="https://example.com/token-image.png"
                      value={formData.imageUri}
                      onChange={(e) => handleInputChange('imageUri', e.target.value)}
                      disabled={!!selectedFile}
                    />
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground">
                        URL input disabled while file is selected
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Base Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.value} value={currency.value}>
                            <div>
                              <div className="font-medium">{currency.label}</div>
                              <div className="text-xs text-muted-foreground">{currency.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Starting Market Cap</Label>
                    <Select value={formData.startingMarketCap} onValueChange={(value) => handleInputChange('startingMarketCap', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {marketCaps.map(cap => (
                          <SelectItem key={cap.value} value={cap.value}>
                            <div>
                              <div className="font-medium">{cap.label}</div>
                              <div className="text-xs text-muted-foreground">{cap.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Creator Coin</CardTitle>
                <CardDescription>
                  Deploy a creator coin with vesting schedule and enhanced features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Advanced Creator Coin Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="creator-name">Creator Name *</Label>
                    <Input
                      id="creator-name"
                      placeholder="Creator Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creator-symbol">Creator Symbol *</Label>
                    <Input
                      id="creator-symbol"
                      placeholder="CREATOR"
                      value={formData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      maxLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creator-description">Creator Description</Label>
                  <Textarea
                    id="creator-description"
                    placeholder="Tell people about yourself and your creator coin..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Media Upload Section for Creator Coins */}
                <div className="space-y-4">
                  <Label>Creator Coin Asset (Logo, Avatar, Media)</Label>
                  
                  {!selectedFile ? (
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                        isDragging 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('creator-media-upload')?.click()}
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm font-medium">Upload your creator coin asset</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports: JPG, PNG, GIF, SVG, MP4, MOV, MP3, WAV (max 50MB)
                        </p>
                      </div>
                      <input
                        id="creator-media-upload"
                        type="file"
                        className="hidden"
                        accept="image/*,video/*,audio/*"
                        onChange={handleFileInput}
                        disabled={!isConnected}
                      />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const IconComponent = getFileTypeIcon(selectedFile);
                            return <IconComponent className="h-5 w-5 text-purple-500" />;
                          })()}
                          <div>
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
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
                      
                      {/* Media Preview */}
                      {selectedFile.type.startsWith('image/') && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {selectedFile.type.startsWith('video/') && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <video src={previewUrl} className="w-full h-full object-cover" controls />
                        </div>
                      )}
                      {selectedFile.type.startsWith('audio/') && (
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <Music className="h-8 w-8 text-purple-500" />
                            <div>
                              <p className="font-medium">Audio Preview</p>
                              <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                            </div>
                          </div>
                          <audio src={previewUrl} controls className="w-full" />
                        </div>
                      )}
                    </div>
                  )}</div>

                <div className="space-y-4">
                  <h4 className="font-medium">Social Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter/X</Label>
                      <Input
                        id="twitter"
                        placeholder="@username"
                        value={formData.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discord">Discord</Label>
                      <Input
                        id="discord"
                        placeholder="Discord server invite"
                        value={formData.discord}
                        onChange={(e) => handleInputChange('discord', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://yourwebsite.com"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creator Coin Features */}
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4">
                  Creator Coin Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800 dark:text-green-200">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-300">✓</Badge>
                    500M tokens to liquidity pool
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-300">✓</Badge>
                    500M tokens vested over 5 years
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-300">✓</Badge>
                    Automatic Uniswap V4 integration
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-300">✓</Badge>
                    Built-in rewards distribution
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            {/* Import Short-Form Content */}
            <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Import Short-Form Content
                </CardTitle>
                <CardDescription>
                  Import videos from TikTok, YouTube Shorts, Instagram Reels, or Twitter and create tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="import-url">Content URL *</Label>
                  <Input
                    placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="flex-1"
                    disabled={!isConnected}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports: TikTok, YouTube Shorts, Instagram Reels, Twitter videos (15-90 seconds)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-token-name">Token Name *</Label>
                    <Input
                      id="import-token-name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Epic Dance Token"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="import-token-symbol">Symbol *</Label>
                    <Input
                      id="import-token-symbol"
                      value={formData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      placeholder="DANCE"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="import-description">Description (Optional)</Label>
                  <Textarea
                    id="import-description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe why this content should be tokenized..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Base Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.value} value={currency.value}>
                            <div>
                              <div className="font-medium">{currency.label}</div>
                              <div className="text-xs text-muted-foreground">{currency.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Starting Market Cap</Label>
                    <Select value={formData.startingMarketCap} onValueChange={(value) => handleInputChange('startingMarketCap', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {marketCaps.map(cap => (
                          <SelectItem key={cap.value} value={cap.value}>
                            <div>
                              <div className="font-medium">{cap.label}</div>
                              <div className="text-xs text-muted-foreground">{cap.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleUrlImport}
                  disabled={!isConnected || !importUrl.trim() || urlImportMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {urlImportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing shorts content...
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
            {/* Create Channel Content */}
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Create Your Channel Token
                </CardTitle>
                <CardDescription>
                  Deploy a Zora-based channel with bonding curve tokenomics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateChannel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 mt-8">
          {!isConnected ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Connect your wallet to create tokens</p>
              <Button onClick={() => {/* Add wallet connection logic */}}>
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handleCreateToken}
                disabled={isLoading || isUploading || !formData.name || !formData.symbol}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading Media...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Token...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    Create Token
                  </>
                )}
              </Button>

              <Button variant="outline" size="lg" asChild>
                <a href="/contents" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View All Content
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <Card className="mt-8 bg-gray-50 dark:bg-gray-800/50">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">How Zora Factory Works</h3>
            <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
              Your token will be deployed using your custom Zora factory at{' '}
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                0xAe028301c7822F2c254A43451D22dB5Fe447a4a0
              </code>{' '}
              on Base network. The factory automatically creates bonding curves, sets up Uniswap V4 hooks, 
              and enables decentralized trading with built-in creator rewards.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
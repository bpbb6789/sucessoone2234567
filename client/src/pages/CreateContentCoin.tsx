import { useState } from 'react';
import { Upload, Link, FileImage, Video, Music, Palette, FileText, Loader2, Trash2, Play, Coins, Sparkles, ExternalLink, ImageIcon, VideoIcon, MusicIcon, FileTextIcon, Download, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatorCoinUpload, useDeployCreatorCoin } from '@/hooks/useCreatorCoins';
import { useUrlImport } from '@/hooks/useContentImports';
import { useQuery } from '@tanstack/react-query';
import CreateChannel from '@/components/CreateChannel';
import { useTriggerNotification } from "@/hooks/useNotifications";
import { useMutation } from '@tanstack/react-query'; // Import useMutation

const contentTypes = [
  { id: 'image', name: 'Image', icon: FileImage, description: 'JPG, PNG, GIF, SVG images', accept: 'image/*' },
  { id: 'video', name: 'Video', icon: Video, description: 'MP4, MOV, AVI videos', accept: 'video/*' },
  { id: 'audio', name: 'Audio', icon: Music, description: 'MP3, WAV, FLAC audio files', accept: 'audio/*' },
  { id: 'gif', name: 'Animation', icon: Palette, description: 'GIF, WebM animations', accept: 'image/gif,video/webm' },
  { id: 'document', name: 'Document', icon: FileText, description: 'PDF, TXT documents', accept: '.pdf,.txt' },
];

const currencies = [
  { value: 'ETH', label: 'ETH', description: 'Ethereum' },
  { value: 'ZORA', label: 'ZORA', description: 'Zora Protocol Token' },
];

const marketCaps = [
  { value: 'LOW', label: 'Low ($1K)', description: 'Lower initial price, accessible entry' },
  { value: 'HIGH', label: 'High ($10K)', description: 'Higher initial price, anti-sniping' },
];

export default function CreateContentCoin() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadedCoin, setUploadedCoin] = useState<any>(null);

  // Import tab state
  const [importUrl, setImportUrl] = useState('');
  const [activeTab, setActiveTab] = useState('upload');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coinName: '',
    coinSymbol: '',
    currency: 'ETH',
    startingMarketCap: 'LOW',
    twitter: '',
    discord: '',
    website: '',
    // Added for notification context
    creatorName: '', 
    name: ''
  });

  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const uploadMutation = useCreatorCoinUpload();
  // const deployMutation = useDeployCreatorCoin(); // This is replaced by the useMutation hook below
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
    setSelectedFile(file);

    // Determine content type based on file type
    let contentType = 'document';
    if (file.type.startsWith('image/')) {
      contentType = file.type === 'image/gif' ? 'gif' : 'image';
    } else if (file.type.startsWith('video/')) {
      contentType = 'video';
    } else if (file.type.startsWith('audio/')) {
      contentType = 'audio';
    }

    setSelectedType(contentType);

    // Generate auto coin name from filename
    const fileName = file.name.split('.')[0].replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    const coinSymbol = fileName.replace(/\s+/g, '').toUpperCase().slice(0, 6);

    setFormData(prev => ({
      ...prev,
      title: fileName,
      coinName: fileName,
      coinSymbol: coinSymbol,
      creatorName: userChannelData?.name || '', // Set creator name for notification
      name: fileName // Set name for notification
    }));

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = contentTypes.find(t => t.id === typeId)?.accept || '*/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    };
    input.click();
  };

  const handleUpload = async () => {
    console.log('🚀 Starting content upload...');

    if (!selectedFile || !address || !selectedType) {
      console.error('❌ Missing required information:', { 
        hasFile: !!selectedFile, 
        hasAddress: !!address, 
        hasType: !!selectedType 
      });
      toast({
        title: "Missing Information",
        description: "Please select a file and connect your wallet",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title || !formData.coinName || !formData.coinSymbol) {
      console.error('❌ Missing form details:', formData);
      toast({
        title: "Missing Details",
        description: "Please fill in the title, coin name, and symbol",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Uploading content with data:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        contentType: selectedType,
        coinName: formData.coinName,
        coinSymbol: formData.coinSymbol,
        creator: address
      });

      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        creatorAddress: address,
        title: formData.title,
        description: formData.description,
        contentType: selectedType,
        coinName: formData.coinName,
        coinSymbol: formData.coinSymbol,
        currency: formData.currency,
        startingMarketCap: formData.startingMarketCap,
        twitter: formData.twitter || undefined,
        discord: formData.discord || undefined,
        website: formData.website || undefined
      });

      console.log('✅ Upload successful:', result);
      setUploadedCoin(result.coin);

      // Trigger notification for content coin creation (not launched yet)
      triggerNotification.mutate({
        type: 'content_coin_created',
        data: {
          recipientAddress: address,
          creatorAddress: address,
          creatorName: formData.creatorName || 'Creator',
          coinName: formData.coinName,
          coinId: result.coin.id
        }
      });

      toast({
        title: "Content Uploaded!",
        description: `${formData.coinName} is ready for tokenization with Zora`,
      });
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload content",
        variant: "destructive"
      });
    }
  };

  // Define the deployMutation using useMutation
  const deployMutation = useMutation({
    mutationFn: async () => {
      if (!uploadedCoin) throw new Error('No coin to deploy');

      const response = await fetch(`/api/creator-coins/${uploadedCoin.id}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Deploy error:', errorText);
        throw new Error(errorText || 'Deployment failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Deployment successful:', data);
      
      // Update the coin with deployment info
      setUploadedCoin((prev: any) => prev ? {
        ...prev,
        status: 'deployed',
        coinAddress: data.coin?.coinAddress || 'Deployed',
        deploymentTxHash: data.coin?.txHash
      } : null);

      // Trigger notification for successful deployment (now actually launched)
      triggerNotification.mutate({
        type: 'content_coin_launch',
        data: {
          recipientAddress: address,
          creatorAddress: address,
          creatorName: formData.creatorName || 'Creator',
          coinName: uploadedCoin?.coinName || 'Content Coin',
          coinId: uploadedCoin?.id,
          coinAddress: data.coin?.coinAddress,
          txHash: data.coin?.txHash
        }
      });

      // Show success toast
      toast({
        title: "Deployment Successful! 🚀",
        description: `Your content coin "${uploadedCoin?.coinName}" has been deployed to the blockchain!`,
      });
    },
    onError: (error) => {
      console.error('❌ Deployment failed:', error);
      // Show error toast
      if (window.showToast) {
        window.showToast({
          title: "Deployment Failed ❌",
          description: error.message || "Failed to deploy your content coin. Please try again.",
          type: "error"
        });
      }
    },
  });


  const handleDeploy = async () => {
    console.log('🚀 Starting coin deployment...', { coinId: uploadedCoin?.id, coinName: uploadedCoin?.coinName });

    if (!uploadedCoin?.id) {
      toast({
        title: "Error",
        description: "No uploaded content to deploy",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to deploy creator coins",
        variant: "destructive",
      });
      return;
    }

    deployMutation.mutate();
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadedCoin(null);
    setSelectedType('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleUrlImport = async () => {
    if (!importUrl || !formData.coinName || !formData.coinSymbol) {
      toast({
        title: "Missing Information",
        description: "Please fill in URL, coin name, and symbol.",
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
        contentType: 'reel', // Default to reel for shorts
        title: formData.title, // Use title from form data
        description: formData.description || `Content imported from ${importUrl}`,
        coinName: formData.coinName,
        coinSymbol: formData.coinSymbol
      });

      // If import was successful, treat it like an uploaded coin
      setUploadedCoin({
        id: result.content.id,
        coinName: formData.coinName,
        coinSymbol: formData.coinSymbol,
        contentType: 'video',
        status: 'uploaded'
      });

      // Set creator name and name for notification context
      setFormData(prev => ({
        ...prev,
        creatorName: userChannelData?.name || '',
        name: formData.coinName // Use coinName as the name for notification
      }));

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



  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create Content Coins
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload your content or import shorts and transform them into tradable creator coins using Zora's advanced bonding curve technology
          </p>
        </div>



        {/* Tabs for Upload vs Import vs Create Channel */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2" data-testid="tab-upload">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2" data-testid="tab-import">
              <ExternalLink className="h-4 w-4" />
              Import Shorts
            </TabsTrigger>
            <TabsTrigger value="channel" className="flex items-center gap-2" data-testid="tab-channel">
              <Coins className="h-4 w-4" />
              Create Channel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Content */}
            {!selectedFile && !uploadedCoin && (
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Choose Content Type
              </CardTitle>
              <CardDescription>
                Select the type of content you want to tokenize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card 
                      key={type.id}
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        selectedType === type.id 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => !isConnected ? null : handleTypeSelect(type.id)}
                      data-testid={`content-type-${type.id}`}
                    >
                      <CardContent className="p-4 text-center">
                        <Icon className={`h-8 w-8 mx-auto mb-2 ${
                          selectedType === type.id ? 'text-purple-600' : 'text-gray-500'
                        }`} />
                        <h3 className="font-medium text-sm">{type.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Upload */}
        {selectedType && !selectedFile && (
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent 
              className={`p-8 border-2 border-dashed transition-colors ${
                isDragging 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-lg font-medium mb-2">Upload Your {contentTypes.find(t => t.id === selectedType)?.name}</h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                <input
                  type="file"
                  accept={contentTypes.find(t => t.id === selectedType)?.accept}
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                  data-testid="file-upload-input"
                  disabled={!isConnected}
                />
                <label htmlFor="file-upload">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" data-testid="upload-button" disabled={!isConnected}>
                    Choose File
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Preview & Form */}
        {selectedFile && !uploadedCoin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview */}
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Content Preview</span>
                  <Button variant="ghost" size="sm" onClick={resetUpload} data-testid="reset-upload">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4">
                  {selectedType === 'image' || selectedType === 'gif' ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : selectedType === 'video' ? (
                    <video src={previewUrl} className="w-full h-full object-cover" controls />
                  ) : selectedType === 'audio' ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Music className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                        <audio src={previewUrl} controls className="mx-auto" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                        <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size:</span>
                    <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{selectedType}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form */}
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle>Creator Coin Details</CardTitle>
                <CardDescription>
                  Set up your content coin for Zora deployment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Content Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="My Amazing Content"
                    data-testid="input-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your content and why it should be tokenized..."
                    rows={3}
                    data-testid="input-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coinName">Coin Name *</Label>
                    <Input
                      id="coinName"
                      value={formData.coinName}
                      onChange={(e) => setFormData(prev => ({ ...prev, coinName: e.target.value }))}
                      placeholder="My Content Coin"
                      data-testid="input-coin-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coinSymbol">Symbol *</Label>
                    <Input
                      id="coinSymbol"
                      value={formData.coinSymbol}
                      onChange={(e) => setFormData(prev => ({ ...prev, coinSymbol: e.target.value.toUpperCase() }))}
                      placeholder="MCC"
                      maxLength={6}
                      data-testid="input-coin-symbol"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger data-testid="select-currency">
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
                    <Label htmlFor="marketCap">Starting Market Cap</Label>
                    <Select value={formData.startingMarketCap} onValueChange={(value) => setFormData(prev => ({ ...prev, startingMarketCap: value }))}>
                      <SelectTrigger data-testid="select-market-cap">
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

                <div className="space-y-4">
                  <h4 className="font-medium">Social Links (Optional)</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter/X</Label>
                      <Input
                        id="twitter"
                        value={formData.twitter}
                        onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                        placeholder="https://twitter.com/username"
                        data-testid="input-twitter"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discord">Discord</Label>
                      <Input
                        id="discord"
                        value={formData.discord}
                        onChange={(e) => setFormData(prev => ({ ...prev, discord: e.target.value }))}
                        placeholder="https://discord.gg/invite"
                        data-testid="input-discord"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                        data-testid="input-website"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleUpload}
                  disabled={!isConnected || uploadMutation.isPending || !selectedFile || !formData.title || !formData.coinName || !formData.coinSymbol}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  data-testid="upload-content-button"
                >
                  {!isConnected ? (
                    "Connect Wallet to Upload"
                  ) : uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading to IPFS...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload & Prepare Coin
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            {/* Import Content Form */}
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Import Short-Form Content
                </CardTitle>
                <CardDescription>
                  Import videos from TikTok, YouTube Shorts, Instagram Reels, or Twitter and create content coins
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
                    data-testid="import-url-input"
                    disabled={!isConnected}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports: TikTok, YouTube Shorts, Instagram Reels, Twitter videos (15-90 seconds)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-coin-name">Coin Name *</Label>
                    <Input
                      id="import-coin-name"
                      value={formData.coinName}
                      onChange={(e) => setFormData(prev => ({ ...prev, coinName: e.target.value }))}
                      placeholder="Epic Dance Video"
                      data-testid="input-import-coin-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="import-coin-symbol">Symbol *</Label>
                    <Input
                      id="import-coin-symbol"
                      value={formData.coinSymbol}
                      onChange={(e) => setFormData(prev => ({ ...prev, coinSymbol: e.target.value.toUpperCase() }))}
                      placeholder="DANCE"
                      maxLength={6}
                      data-testid="input-import-coin-symbol"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="import-title">Content Title (Optional)</Label>
                  <Input
                    id="import-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Custom title for your content coin"
                    data-testid="input-import-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="import-description">Description (Optional)</Label>
                  <Textarea
                    id="import-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe why this content should be tokenized..."
                    rows={3}
                    data-testid="input-import-description"
                  />
                </div>

                <Button 
                  onClick={handleUrlImport}
                  disabled={!isConnected || !importUrl.trim() || urlImportMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  data-testid="import-content-button"
                >
                  {urlImportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing shorts content...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Import & Prepare Coin
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channel" className="space-y-6">
            {/* Create Channel Content */}
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Create Your Channel Coin
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

        {/* Deployment (shown for both upload and import) */}
        {uploadedCoin && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Coins className="h-5 w-5" />
                Content Ready for Tokenization!
              </CardTitle>
              <CardDescription>
                Your content has been processed and is ready to be deployed as a creator coin using Zora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Coin Name:</span>
                  <div className="font-medium">{uploadedCoin.coinName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Symbol:</span>
                  <div className="font-medium">{uploadedCoin.coinSymbol}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Content Type:</span>
                  <div className="font-medium capitalize">{uploadedCoin.contentType}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {uploadedCoin.status}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleDeploy}
                  disabled={!isConnected || deployMutation.isPending || !uploadedCoin}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  data-testid="deploy-coin-button"
                >
                  {!isConnected ? (
                    "Connect Wallet to Deploy"
                  ) : deployMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deploying Contract...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      Deploy Creator Coin
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetUpload} data-testid="create-another-button">
                  Create Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
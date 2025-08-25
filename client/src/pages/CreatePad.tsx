import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "@/hooks/useWallet";
import { Upload, X, ImageIcon, Music, Play, Sparkles, Coins, Zap, TrendingUp } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useDeployPad } from "@/hooks/useDeployPad";

const createPadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be under 100 characters"),
  description: z.string().optional(),
  mediaFile: z.any().refine((file) => file instanceof File, "Please select a media file"),
  tokenName: z.string().min(3, "Token name must be at least 3 characters").max(50, "Token name must be under 50 characters"),
  tokenSymbol: z.string().min(2, "Symbol must be 2-10 characters").max(10, "Symbol must be 2-10 characters").regex(/^[A-Z0-9]+$/, "Symbol must be uppercase letters/numbers only"),
  tags: z.string().optional(),
});

type CreatePadForm = z.infer<typeof createPadSchema>;

const mediaTypes = [
  { id: 'image', name: 'Image', icon: ImageIcon, description: 'JPG, PNG, GIF (max 10MB)', accept: 'image/*', color: 'text-blue-500' },
  { id: 'gif', name: 'GIF', icon: Play, description: 'Animated GIFs (max 20MB)', accept: 'image/gif', color: 'text-green-500' },
  { id: 'audio', name: 'Audio', icon: Music, description: 'MP3, WAV (max 50MB)', accept: 'audio/*', color: 'text-purple-500' },
  { id: 'animation', name: 'Animation', icon: Sparkles, description: 'MP4, WebM (max 100MB)', accept: 'video/*', color: 'text-orange-500' },
];

export default function CreatePad() {
  const { address, connect, disconnect } = useAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { deployPad, isDeploying, deploymentResult } = useDeployPad();
  const [selectedMediaType, setSelectedMediaType] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [step, setStep] = useState<"form" | "uploading" | "deploying" | "success">("form");
  const [progress, setProgress] = useState("");
  const [createdPadId, setCreatedPadId] = useState<string>("");

  const form = useForm<CreatePadForm>({
    resolver: zodResolver(createPadSchema),
    defaultValues: {
      title: "",
      description: "",
      tokenName: "",
      tokenSymbol: "",
      tags: "",
    },
  });

  // Watch form values for auto-suggestions
  const watchedTitle = form.watch("title");

  // Auto-suggest token name and symbol from title
  const handleTitleChange = (title: string) => {
    if (title && !form.getValues("tokenName")) {
      form.setValue("tokenName", title);
    }
    if (title && !form.getValues("tokenSymbol")) {
      const symbol = title
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8);
      form.setValue("tokenSymbol", symbol);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size based on type
    const maxSizes = {
      image: 10 * 1024 * 1024, // 10MB
      gif: 20 * 1024 * 1024, // 20MB
      audio: 50 * 1024 * 1024, // 50MB
      animation: 100 * 1024 * 1024, // 100MB
    };

    const fileType = file.type.startsWith('image/gif') ? 'gif' :
                    file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('audio/') ? 'audio' :
                    file.type.startsWith('video/') ? 'animation' : 'unknown';

    if (fileType === 'unknown') {
      toast({
        title: "Unsupported file type",
        description: "Please select an image, GIF, audio, or video file",
        variant: "destructive"
      });
      return;
    }

    const maxSize = maxSizes[fileType as keyof typeof maxSizes];
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `${fileType} files must be under ${maxSize / (1024 * 1024)}MB`,
        variant: "destructive"
      });
      return;
    }

    form.setValue("mediaFile", file);
    setSelectedMediaType(fileType);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    form.setValue("mediaFile", null as any);
    setSelectedMediaType("");
    setPreviewUrl("");
  };

  const createPadMutation = useMutation({
    mutationFn: async (data: CreatePadForm) => {
      if (!address) throw new Error("Wallet not connected");

      setStep("uploading");
      setProgress("Uploading media to IPFS...");

      // Upload media file to IPFS
      const formData = new FormData();
      formData.append('file', data.mediaFile);

      const uploadResponse = await fetch('/api/upload/file', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload media file');
      }

      const uploadData = await uploadResponse.json();
      const mediaCid = uploadData.cid;

      setProgress("Creating pad record...");

      // Create pad in database
      const padData = {
        creatorAddress: address,
        title: data.title,
        description: data.description || "",
        mediaType: selectedMediaType,
        mediaCid: mediaCid,
        tokenName: data.tokenName,
        tokenSymbol: data.tokenSymbol,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        status: "pending",
      };

      const response = await apiRequest("POST", "/api/pads", padData);
      const createdPad = await response.json(); // Await the JSON parsing

      setCreatedPadId(createdPad.id);
      setProgress("Deploying token on blockchain...");
      setStep("deploying");

      // Automatically deploy the token after creation
      try {
        console.log("🚀 Starting token deployment for pad:", createdPad.id);

        if (!deployPad) {
          throw new Error("deployPad function not available");
        }

        // Call the deployPad hook with the new pad ID
        const deployResult = await deployPad(createdPad.id);

        // Check if deployment was successful
        if (deployResult && deployResult.success) {
          console.log('Token deployed successfully:', deployResult);
          
          // Show success message with explorer link
          const message = deployResult.isSimulated 
            ? `${data.title} token deployment simulated successfully`
            : `${data.title} token deployed on Base Sepolia testnet!`;

          toast({
            title: deployResult.isSimulated ? "Deployment Simulated!" : "Token Deployed!",
            description: message,
          });

          // Log deployment details
          console.log('Deployment details:', {
            tokenAddress: deployResult.tokenAddress,
            txHash: deployResult.txHash,
            explorerUrl: deployResult.explorerUrl,
            isReal: !deployResult.isSimulated
          });
        } else {
          throw new Error((deployResult && deployResult.message) || 'Deployment failed');
        }

        setStep("success");

      } catch (error: any) {
        console.error("🚀 Token deployment failed:", error);
        console.error("🚀 Error message:", error.message);
        console.error("🚀 Error stack:", error.stack);

        // Even if deployment fails, pad was created successfully
        setStep("success");
        toast({
          title: "Pad Created",
          description: `Pad created but token deployment failed: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/pads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create pad. Please try again.",
        variant: "destructive",
      });
      setStep("form");
    },
  });

  const onSubmit = (data: CreatePadForm) => {
    createPadMutation.mutate(data);
  };

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Coins className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400">Please connect your wallet to create a meme token pad</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">✓</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Pad Created Successfully!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your meme token is now live and ready for trading.
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.href = "/"} className="w-full">
                View All Pads
              </Button>
              <Button variant="outline" onClick={() => {
                setStep("form");
                form.reset();
                setPreviewUrl("");
                setSelectedMediaType("");
              }} className="w-full">
                Create Another Pad
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "uploading" || step === "deploying") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {step === "deploying" ? "Deploying Token" : "Creating Your Pad"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{progress}</p>
              {step === "deploying" && (
                <div className="text-xs text-gray-500 mt-2">
                  🚀 Deploying with Doppler V4 SDK...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4" data-testid="page-create-pad">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h1 className="text-2xl font-bold">Create Pad</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload media, create a tradable meme token
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              Token Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Media Upload */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Upload Media</h3>

                  {/* Media Type Selection */}
                  <div className="grid grid-cols-4 gap-2">
                    {mediaTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <div
                          key={type.id}
                          className={`p-2 border rounded text-center cursor-pointer transition-all ${
                            selectedMediaType === type.id 
                              ? 'border-green-500 bg-green-500/10' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mx-auto mb-1 ${type.color}`} />
                          <p className="text-xs font-medium">{type.name}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* File Upload Area */}
                  <FormField
                    control={form.control}
                    name="mediaFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-3">
                            {!previewUrl ? (
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  Drop files or browse
                                </p>
                                <input
                                  type="file"
                                  accept="image/*,audio/*,video/*"
                                  onChange={handleFileChange}
                                  className="hidden"
                                  id="media-upload"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById('media-upload')?.click()}
                                >
                                  Choose File
                                </Button>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                                  {selectedMediaType === 'image' || selectedMediaType === 'gif' ? (
                                    <img
                                      src={previewUrl}
                                      alt="Preview"
                                      className="w-full max-h-64 object-contain rounded"
                                    />
                                  ) : selectedMediaType === 'audio' ? (
                                    <div className="flex items-center justify-center p-8">
                                      <div className="text-center">
                                        <Music className="w-12 h-12 mx-auto mb-2 text-purple-500" />
                                        <p className="font-medium">Audio File Ready</p>
                                        <audio controls className="mt-2">
                                          <source src={previewUrl} />
                                        </audio>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center p-8">
                                      <div className="text-center">
                                        <Play className="w-12 h-12 mx-auto mb-2 text-orange-500" />
                                        <p className="font-medium">Video File Ready</p>
                                        <video controls className="mt-2 max-h-48">
                                          <source src={previewUrl} />
                                        </video>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={clearFile}
                                  className="absolute top-2 right-2"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Content Details */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Content Details</h3>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="My Epic Meme" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              handleTitleChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell people about your meme..."
                            {...field}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="meme, funny, crypto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Token Economics */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Token Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tokenName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Epic Meme Token" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tokenSymbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Symbol</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="EPIC" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              maxLength={10}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Token Preview */}
                  {form.watch("tokenName") && form.watch("tokenSymbol") && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm font-medium mb-2">Token Preview:</p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {form.watch("tokenSymbol")?.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{form.watch("tokenName")}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">${form.watch("tokenSymbol")}</Badge>
                            <span className="text-xs text-gray-500">Starting at $0.000001</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={createPadMutation.isPending || !previewUrl}
                >
                  {createPadMutation.isPending ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-spin" />
                      Creating Pad...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Create Meme Token Pad
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
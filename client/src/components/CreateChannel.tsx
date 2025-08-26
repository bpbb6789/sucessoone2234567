import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "@/hooks/useWallet";
import { TOKEN_FACTORY_ADDRESS } from "@/lib/addresses";
import { TOKEN_FACTORY_ABI } from "../../../abi/TokenFactoryAbi";
import TransactionComponent from "@/components/Transaction";
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';
import { ChevronDown, Upload, Coins, Zap, X, ImageIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const createChannelSchema = z.object({
  name: z.string().min(3, "Channel name must be at least 3 characters").max(32, "Channel name must be under 32 characters"),
  ticker: z.string().min(3, "Ticker must be 3-8 characters").max(8, "Ticker must be 3-8 characters").regex(/^[A-Z]+$/, "Ticker must be uppercase letters only"),
  category: z.string().min(1, "Please select a category"),
  avatarFile: z.any().optional(),
  coverFile: z.any().optional(),
  payoutAddress: z.string().optional(),
  chainId: z.number().default(8453), // Base mainnet
  description: z.string().optional(),
});

type CreateChannelForm = z.infer<typeof createChannelSchema>;

const categories = [
  "Reels", "Podcasts", "Events", "Art", "Music", "Gaming", "Tech", "Education", "Lifestyle"
];

const chains = [
  { id: 8453, name: "Base", logo: "🔵" },
  { id: 84532, name: "Base Sepolia", logo: "🔵" },
];

export default function CreateChannel() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [step, setStep] = useState<"form" | "uploading" | "deploying" | "creating" | "success">("form");
  const [progress, setProgress] = useState("");
  const [uploadedData, setUploadedData] = useState<{
    avatarCid?: string;
    coverCid?: string;
    metadataUri: string;
  } | null>(null);

  const form = useForm<CreateChannelForm>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: "",
      ticker: "",
      category: "",
      payoutAddress: address || "",
      chainId: 8453,
      description: "",
    },
  });

  // Handle IPFS uploads before blockchain transaction
  const handleIPFSUploads = async (data: CreateChannelForm) => {
    if (!address) throw new Error("Wallet not connected");

    setStep("uploading");
    setProgress("Uploading media to IPFS");

    const avatarCid = data.avatarFile ? await uploadToIPFS(data.avatarFile) : undefined;
    const coverCid = data.coverFile ? await uploadToIPFS(data.coverFile) : undefined;
    
    setProgress("Preparing metadata");
    const metadataUri = await uploadMetadataToIPFS({
      name: data.name,
      description: data.description || `${data.name} Channel Coin`,
      image: avatarCid ? `ipfs://${avatarCid}` : undefined,
      external_url: `${window.location.origin}/channel/${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      attributes: [
        { trait_type: "Category", value: data.category },
        { trait_type: "Ticker", value: data.ticker },
      ]
    });

    setUploadedData({ avatarCid, coverCid, metadataUri });
    setStep("deploying");
    setProgress("Ready to deploy Channel Coin");
  };

  // Handle successful blockchain transaction
  const handleTransactionSuccess = async (status: LifecycleStatus) => {
    if (status.statusName === 'success' && uploadedData && status.statusData) {
      setStep("creating");
      setProgress("Creating channel...");

      try {
        // Extract token address from transaction receipt
        const receipt = status.statusData.transactionReceipts?.[0];
        const tokenAddress = receipt?.logs?.[0]?.address || "0x0000000000000000000000000000000000000000";

        const formData = form.getValues();
        const channelData = {
          owner: address,
          createdBy: address,
          name: formData.name,
          ticker: formData.ticker,
          coinAddress: tokenAddress,
          chainId: formData.chainId,
          avatarCid: uploadedData.avatarCid,
          coverCid: uploadedData.coverCid,
          category: formData.category,
          txHash: receipt?.transactionHash || "",
        };

        const response = await apiRequest("POST", "/api/web3-channels", channelData);
        await response.json();
        
        setStep("success");
        toast({
          title: "Channel Created!",
          description: "Your channel coin has been deployed and channel created successfully.",
        });
      } catch (error: any) {
        toast({
          title: "Channel Creation Failed",
          description: error.message || "Failed to create channel record",
          variant: "destructive",
        });
        setStep("form");
        setUploadedData(null);
      }
    }
  };

  const createChannelMutation = useMutation({
    mutationFn: handleIPFSUploads,
    onSuccess: () => {
      // IPFS upload complete, ready for blockchain transaction
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      });
      setStep("form");
      setUploadedData(null);
    },
  });

  const onSubmit = (data: CreateChannelForm) => {
    createChannelMutation.mutate(data);
  };

  if (!address) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Coins className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Please connect your wallet to create a channel</p>
        </CardContent>
      </Card>
    );
  }

  if (step === "success") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl">✓</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Channel Created Successfully!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your channel coin has been deployed on-chain and your channel is ready.
          </p>
          <Button onClick={() => window.location.href = "/profile"}>
            Open Channel Manager
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "uploading") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Uploading to IPFS</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{progress}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "deploying" && uploadedData) {
    const formData = form.getValues();
    const contractArgs = [
      formData.name,
      formData.ticker,
      "", // twitter (optional)
      "", // discord (optional) 
      formData.description || `${formData.name} Channel`,
      `ipfs://${uploadedData.metadataUri}`
    ];

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Deploy Your Channel Coin</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Files uploaded successfully! Now deploy your channel coin on-chain.
            </p>
          </div>
          
          <TransactionComponent
            contractAddress={TOKEN_FACTORY_ADDRESS}
            contractAbi={TOKEN_FACTORY_ABI}
            functionName="deployERC20Token"
            cta="Deploy Channel Coin"
            args={[contractArgs[0], contractArgs[1]]} // name, ticker
            handleOnStatus2={handleTransactionSuccess}
          />
          
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => {
                setStep("form");
                setUploadedData(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "creating") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Creating Channel Record</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{progress}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Create Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              {/* Required Fields */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Channel name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ticker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticker *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ALEX" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        maxLength={8}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="avatarFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Avatar</FormLabel>
                      <FormControl>
                        <AvatarUploadField 
                          field={field} 
                          uploadProgress={progress}
                          isUploading={step === "uploading" || step === "creating"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Cover</FormLabel>
                      <FormControl>
                        <CoverUploadField 
                          field={field} 
                          uploadProgress={progress}
                          isUploading={step === "uploading" || step === "creating"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Advanced Settings */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    Advanced Settings
                    <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <FormField
                    control={form.control}
                    name="payoutAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payout Address</FormLabel>
                        <FormControl>
                          <Input placeholder={address} {...field} />
                        </FormControl>
                        <FormDescription>
                          Defaults to your connected wallet
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="chainId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chain</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {chains.map((chain) => (
                              <SelectItem key={chain.id} value={String(chain.id)}>
                                {chain.logo} {chain.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Zora default; Doppler later toggle
                        </FormDescription>
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
                            placeholder="Tell people about your channel..."
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              <Button 
                type="submit" 
                className="w-full mt-3" 
                size="default"
                disabled={createChannelMutation.isPending}
              >
                Create Channel
              </Button>
              
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Real IPFS upload functions
async function uploadToIPFS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload/file', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload file to IPFS');
  }
  
  const data = await response.json();
  return data.cid;
}

async function uploadMetadataToIPFS(metadata: any): Promise<string> {
  const response = await fetch('/api/upload/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload metadata to IPFS');
  }
  
  const data = await response.json();
  return data.cid;
}

// Compact Avatar Upload Component
function AvatarUploadField({ field, uploadProgress, isUploading }: {
  field: any;
  uploadProgress: string;
  isUploading: boolean;
}) {
  const [previewImage, setPreviewImage] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    field.onChange(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreviewImage("");
    field.onChange(null);
  };

  if (!previewImage) {
    return (
      <div className={`border-2 border-dashed rounded-lg p-2 text-center transition-colors ${
        isUploading ? 'border-blue-400 bg-blue-50 dark:bg-blue-950' : 
        'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`}>
        <label className="cursor-pointer block">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <div className="flex flex-col items-center space-y-1">
            {isUploading ? (
              <Upload className="h-4 w-4 text-blue-500 animate-pulse" />
            ) : (
              <ImageIcon className="h-4 w-4 text-gray-400" />
            )}
            <div className="text-xs">
              {isUploading ? (
                <span className="text-blue-600 font-medium">Uploading...</span>
              ) : (
                <span className="font-medium text-blue-600">Upload Avatar</span>
              )}
            </div>
          </div>
        </label>
        {isUploading && (
          <div className="mt-2">
            <div className="text-xs text-blue-600">{uploadProgress}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <img 
        src={previewImage} 
        alt="Avatar Preview" 
        className="w-full h-16 rounded-lg object-cover"
      />
      <button
        type="button"
        onClick={clearImage}
        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
          <div className="text-white text-xs text-center">
            <Upload className="h-4 w-4 mx-auto animate-pulse mb-1" />
            <div>{uploadProgress}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact Cover Upload Component
function CoverUploadField({ field, uploadProgress, isUploading }: {
  field: any;
  uploadProgress: string;
  isUploading: boolean;
}) {
  const [previewImage, setPreviewImage] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    field.onChange(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreviewImage("");
    field.onChange(null);
  };

  if (!previewImage) {
    return (
      <div className={`border-2 border-dashed rounded-lg p-2 text-center transition-colors ${
        isUploading ? 'border-blue-400 bg-blue-50 dark:bg-blue-950' : 
        'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`}>
        <label className="cursor-pointer block">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <div className="flex flex-col items-center space-y-1">
            {isUploading ? (
              <Upload className="h-4 w-4 text-blue-500 animate-pulse" />
            ) : (
              <ImageIcon className="h-4 w-4 text-gray-400" />
            )}
            <div className="text-xs">
              {isUploading ? (
                <span className="text-blue-600 font-medium">Uploading...</span>
              ) : (
                <span className="font-medium text-blue-600">Upload Cover</span>
              )}
            </div>
          </div>
        </label>
        {isUploading && (
          <div className="mt-2">
            <div className="text-xs text-blue-600">{uploadProgress}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <img 
        src={previewImage} 
        alt="Cover Preview" 
        className="w-full h-16 rounded-lg object-cover"
      />
      <button
        type="button"
        onClick={clearImage}
        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
          <div className="text-white text-xs text-center">
            <Upload className="h-4 w-4 mx-auto animate-pulse mb-1" />
            <div>{uploadProgress}</div>
          </div>
        </div>
      )}
    </div>
  );
}
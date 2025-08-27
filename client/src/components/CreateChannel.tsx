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
import { useMutation } from "@tanstack/react-query";
import { ChevronDown, Upload, Coins, Zap, X, ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const createChannelSchema = z.object({
  name: z.string().min(3, "Channel name must be at least 3 characters").max(32, "Channel name must be under 32 characters"),
  ticker: z.string().min(3, "Ticker must be 3-8 characters").max(8, "Ticker must be 3-8 characters").regex(/^[A-Z]+$/, "Ticker must be uppercase letters only"),
  category: z.string().min(1, "Please select a category"),
  avatarFile: z.any().optional(),
  coverFile: z.any().optional(),
  chainId: z.number().default(8453), // Base mainnet
  description: z.string().optional(),
  currency: z.string().default("ETH"),
});

type CreateChannelForm = z.infer<typeof createChannelSchema>;

const categories = [
  "Reels", "Podcasts", "Events", "Art", "Music", "Gaming", "Tech", "Education", "Lifestyle"
];

const chains = [
  { id: 8453, name: "Base", logo: "🔵" },
  { id: 84532, name: "Base Sepolia", logo: "🔵" },
];

const currencies = [
  { id: "ETH", name: "ETH", logo: "Ξ" },
  { id: "ZORA", name: "ZORA", logo: "⚡" },
];

export default function CreateChannel() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [step, setStep] = useState<"form" | "creating" | "success">("form");

  const form = useForm<CreateChannelForm>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: "",
      ticker: "",
      category: "",
      chainId: 8453,
      description: "",
      currency: "ETH",
    },
  });

  // Create channel using Zora SDK
  const createChannelMutation = useMutation({
    mutationFn: async (data: CreateChannelForm) => {
      if (!address) throw new Error("Wallet not connected");

      setStep("creating");

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('ticker', data.ticker);
      formData.append('category', data.category);
      formData.append('chainId', data.chainId.toString());
      formData.append('currency', data.currency);
      formData.append('creatorAddress', address);
      
      if (data.description) {
        formData.append('description', data.description);
      }
      
      if (data.avatarFile) {
        formData.append('avatarFile', data.avatarFile);
      }
      
      if (data.coverFile) {
        formData.append('coverFile', data.coverFile);
      }

      const response = await apiRequest("POST", "/api/zora-channels", formData);
      return response.json();
    },
    onSuccess: (data) => {
      setStep("success");
      toast({
        title: "Channel Created!",
        description: `Your channel "${data.name}" has been created with Zora SDK.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Channel Creation Failed",
        description: error.message || "Failed to create channel. Please try again.",
        variant: "destructive",
      });
      setStep("form");
    },
  });

  const onSubmit = (data: CreateChannelForm) => {
    createChannelMutation.mutate(data);
  };

  if (!address) {
    return (
      <Card className="w-full max-w-md mx-auto" data-testid="create-channel-connect-wallet">
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
      <Card className="w-full max-w-md mx-auto" data-testid="create-channel-success">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl">✓</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Channel Created!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your Zora-based channel is ready and your coin has been deployed.
          </p>
          <Button 
            onClick={() => window.location.href = "/profile"}
            data-testid="button-open-profile"
          >
            View Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "creating") {
    return (
      <Card className="w-full max-w-md mx-auto" data-testid="create-channel-creating">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Creating Channel</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Deploying your channel coin with Zora SDK...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-2" data-testid="create-channel-form">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Create Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Channel name" 
                        {...field} 
                        data-testid="input-channel-name"
                      />
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
                        data-testid="input-channel-ticker"
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
                        <SelectTrigger data-testid="select-category">
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
                        <AvatarUploadField field={field} />
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
                        <CoverUploadField field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between"
                    data-testid="button-advanced-toggle"
                  >
                    Advanced Settings
                    <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.id} value={currency.id}>
                                {currency.logo} {currency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          ETH for most use cases
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
                            <SelectTrigger data-testid="select-chain">
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
                          Base network for Zora integration
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell people about your channel..."
                            {...field}
                            rows={3}
                            data-testid="input-description"
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
                data-testid="button-create-channel"
              >
                {createChannelMutation.isPending ? "Creating..." : "Create Channel"}
              </Button>
              
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function AvatarUploadField({ field }: { field: any }) {
  const [previewImage, setPreviewImage] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    field.onChange(file);
    
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
      <div className="border-2 border-dashed rounded-lg p-2 text-center transition-colors border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
        <label className="cursor-pointer block">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-avatar-file"
          />
          <div className="flex flex-col items-center space-y-1">
            <ImageIcon className="h-4 w-4 text-gray-400" />
            <div className="text-xs">
              <span className="font-medium text-blue-600">Upload Avatar</span>
            </div>
          </div>
        </label>
      </div>
    );
  }

  return (
    <div className="relative">
      <img 
        src={previewImage} 
        alt="Avatar Preview" 
        className="w-full h-16 rounded-lg object-cover"
        data-testid="img-avatar-preview"
      />
      <button
        type="button"
        onClick={clearImage}
        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors"
        data-testid="button-clear-avatar"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function CoverUploadField({ field }: { field: any }) {
  const [previewImage, setPreviewImage] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    field.onChange(file);
    
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
      <div className="border-2 border-dashed rounded-lg p-2 text-center transition-colors border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
        <label className="cursor-pointer block">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-cover-file"
          />
          <div className="flex flex-col items-center space-y-1">
            <ImageIcon className="h-4 w-4 text-gray-400" />
            <div className="text-xs">
              <span className="font-medium text-blue-600">Upload Cover</span>
            </div>
          </div>
        </label>
      </div>
    );
  }

  return (
    <div className="relative">
      <img 
        src={previewImage} 
        alt="Cover Preview" 
        className="w-full h-16 rounded-lg object-cover"
        data-testid="img-cover-preview"
      />
      <button
        type="button"
        onClick={clearImage}
        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors"
        data-testid="button-clear-cover"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
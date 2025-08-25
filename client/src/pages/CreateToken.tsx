import { UniPumpCreatorAbi } from "../../../abi/UniPumpCreatorAbi"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UNIPUMP_CREATOR_ADDRESS } from "@/lib/addresses"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import TransactionComponent from "@/components/Transaction"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    ticker: z.string().min(2, {
        message: "Ticker must be at least 3 characters.",
    }),
    imageFile: z.any().optional(),
    imageUri: z.string().optional(),
    twitter: z.string().optional(),
    discord: z.string().optional(),
    description: z.string().min(10, {
        message: "Description must be at least 10 characters.",
    }),
})

export default function CreateTokenPage() {
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams()
    const { toast } = useToast()
    const [uploadProgress, setUploadProgress] = useState<string>('')
    const [isUploading, setIsUploading] = useState(false)
    const [previewImage, setPreviewImage] = useState<string>('')

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            ticker: '',
            imageFile: undefined,
            imageUri: "",
            twitter: "",
            discord: "",
            description: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        // Post channel metadata to backend before on-chain tx
        try {
            const res = await fetch('/api/pending-channel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner: '', // TODO: Fill with connected wallet address
                    name: values.name,
                    symbol: values.ticker,
                    description: values.description,
                    twitter: values.twitter,
                    discord: values.discord,
                    imageUri: values.imageUri,
                    bannerImage: '', // Optionally add banner image field
                })
            });
            if (!res.ok) {
                console.error('Failed to cache channel metadata', await res.json());
            }
        } catch (e) {
            console.error('Error posting to /api/pending-channel', e);
        }
        queryClient.invalidateQueries({ queryKey: ["getAllSales"] })
    }

    useEffect(() => {
        const searchTicker = searchParams.get('ticker')
        if (searchTicker) {
            form.setValue('ticker', searchTicker)
        }
    }, [searchParams, form])

    // Assume isLoading is a boolean that would be true if data is being fetched
    // For this example, we'll hardcode it to false as there's no actual data fetching in this component.
    const isLoading = false; 

    if (isLoading) {
        return (
            <div className="p-4 max-w-2xl mx-auto">
                <Skeleton className="h-9 w-48 mb-6" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-3/4 mb-8" />

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Form fields skeleton */}
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}

                        <div className="flex gap-2">
                            <Skeleton className="h-10 flex-1" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const args = [form.watch('name'), form.watch('ticker'), form.watch('twitter'), form.watch('discord'), form.watch('description'), form.watch('imageUri')]

    return (
        <div className="p-4 max-w-md mx-auto" data-testid="page-create-token">
            <h1 className="text-2xl font-bold mb-2">Create Channel</h1>
            <p className="text-sm text-gray-600 mb-4">Deploy your Channel Coin on-chain and create your channel.</p>

            <Card>
                <CardContent className="pt-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">Channel Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="My Amazing Channel" {...field} className="h-9" />
                                        </FormControl>
                                        <p className="text-xs text-gray-500">This will also be your on-chain token name.</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ticker"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">Ticker (3-8 chars) *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ALEX" {...field} className="h-9" maxLength={8} />
                                        </FormControl>
                                        <p className="text-xs text-gray-500">Your on-chain token symbol, e.g. @alex → ALEX.</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">Category *</FormLabel>
                                        <FormControl>
                                            <select 
                                                {...field} 
                                                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm bg-white"
                                            >
                                                <option value="">Select a category</option>
                                                <option value="Entertainment">Entertainment</option>
                                                <option value="Gaming">Gaming</option>
                                                <option value="Education">Education</option>
                                                <option value="Technology">Technology</option>
                                                <option value="Lifestyle">Lifestyle</option>
                                                <option value="Music">Music</option>
                                                <option value="Art">Art</option>
                                                <option value="Sports">Sports</option>
                                                <option value="News">News</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="imageUri"
                                render={({ field }) => (
                                    <ImageUploadField 
                                        field={field}
                                        form={form}
                                        uploadProgress={uploadProgress}
                                        setUploadProgress={setUploadProgress}
                                        isUploading={isUploading}
                                        setIsUploading={setIsUploading}
                                        previewImage={previewImage}
                                        setPreviewImage={setPreviewImage}
                                        toast={toast}
                                        isCompact={true}
                                    />
                                )}
                            />

                            <div className="pt-4">
                                <TransactionComponent
                                    contractAddress={UNIPUMP_CREATOR_ADDRESS}
                                    contractAbi={UniPumpCreatorAbi}
                                    cta="Create Channel"
                                    functionName="createTokenSale"
                                    handleOnStatus2={async (status) => {
                                        queryClient.invalidateQueries({ queryKey: ["getAllSales"] })
                                        queryClient.invalidateQueries({ queryKey: ["/api/web3-channels"] })

                                        // Save web3 channel to database after successful blockchain transaction
                                        if (status.statusName === 'success' && status.receipt) {
                                            try {
                                                // Extract token address from transaction logs
                                                const logs = status.receipt.logs || [];
                                                let tokenAddress = '';
                                                
                                                // Look for token creation event in logs
                                                for (const log of logs) {
                                                    if (log.topics && log.topics.length > 0) {
                                                        // The token address is typically in the log data or topics
                                                        if (log.address && log.address !== UNIPUMP_CREATOR_ADDRESS) {
                                                            tokenAddress = log.address;
                                                            break;
                                                        }
                                                    }
                                                }

                                                const channelData = {
                                                    owner: status.receipt.from || '', // wallet address that created the transaction
                                                    name: form.getValues('name'),
                                                    ticker: form.getValues('ticker'),
                                                    coinAddress: tokenAddress,
                                                    chainId: 84532, // Base Sepolia
                                                    category: 'Lifestyle', // default category
                                                    txHash: status.receipt.transactionHash || '',
                                                    avatarCid: null,
                                                    coverCid: null,
                                                    status: 'active'
                                                };

                                                console.log('Saving channel data:', channelData);

                                                const response = await fetch('/api/web3-channels', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify(channelData)
                                                });

                                                if (!response.ok) {
                                                    const error = await response.text();
                                                    console.error('Failed to save channel:', error);
                                                } else {
                                                    console.log('Channel saved successfully!');
                                                    // Refresh the page to see the new token
                                                    setTimeout(() => {
                                                        window.location.href = '/tokens';
                                                    }, 2000);
                                                }
                                            } catch (error) {
                                                console.error('Failed to save channel to database:', error);
                                            }
                                        }
                                    }}
                                    args={args}
                                />
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

// Image Upload Component with preview and progress
function ImageUploadField({ 
    field, 
    form, 
    uploadProgress, 
    setUploadProgress, 
    isUploading, 
    setIsUploading, 
    previewImage, 
    setPreviewImage, 
    toast,
    isCompact = false
}: {
    field: any
    form: any
    uploadProgress: string
    setUploadProgress: (progress: string) => void
    isUploading: boolean
    setIsUploading: (uploading: boolean) => void
    previewImage: string
    setPreviewImage: (image: string) => void
    toast: any
    isCompact?: boolean
}) {
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file type",
                description: "Please select an image file (JPG, PNG, GIF, etc.)",
                variant: "destructive"
            })
            return
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Please select an image smaller than 5MB",
                variant: "destructive"
            })
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
            setPreviewImage(e.target?.result as string)
        }
        reader.readAsDataURL(file)

        // Start upload
        setIsUploading(true)
        setUploadProgress('Uploading image...')

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload/file', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Upload failed')
            }

            const data = await response.json()
            const imageUrl = `https://gateway.pinata.cloud/ipfs/${data.cid}`
            
            // Update form with the IPFS URL
            form.setValue('imageUri', imageUrl)
            form.setValue('imageFile', file)
            
            setUploadProgress('Upload complete!')
            toast({
                title: "Image uploaded successfully!",
                description: "Your token image is ready"
            })
            
            // Clear progress after 2 seconds
            setTimeout(() => {
                setUploadProgress('')
                setIsUploading(false)
            }, 2000)
        } catch (error) {
            console.error('Upload error:', error)
            setPreviewImage('')
            toast({
                title: "Upload failed",
                description: "Please try again with a different image",
                variant: "destructive"
            })
            setUploadProgress('')
            setIsUploading(false)
        }
    }

    const clearImage = () => {
        setPreviewImage('')
        form.setValue('imageUri', '')
        form.setValue('imageFile', undefined)
        setUploadProgress('')
        setIsUploading(false)
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            <FormItem>
                <FormLabel className="text-sm font-medium">Avatar (Image)</FormLabel>
                <FormControl>
                    <div className="space-y-2">
                        <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
                            isUploading ? 'border-blue-400 bg-blue-50 dark:bg-blue-950' : 
                            'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}>
                            {!previewImage ? (
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
                                            <Upload className="h-6 w-6 text-blue-500 animate-pulse" />
                                        ) : (
                                            <ImageIcon className="h-6 w-6 text-gray-400" />
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
                            ) : (
                                <div className="relative">
                                    <img 
                                        src={previewImage} 
                                        alt="Preview" 
                                        className="w-16 h-16 mx-auto rounded-lg object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors"
                                        data-testid="button-remove-image"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-center text-gray-500">
                            Choose File
                        </div>
                    </div>
                </FormControl>
                <FormMessage />
            </FormItem>
            
            <FormItem>
                <FormLabel className="text-sm font-medium">Cover Media</FormLabel>
                <FormControl>
                    <div className="space-y-2">
                        <div className="border-2 border-dashed rounded-lg p-3 text-center border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                            <label className="cursor-pointer block">
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center space-y-1">
                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                    <div className="text-xs">
                                        <span className="font-medium text-blue-600">Upload Cover</span>
                                    </div>
                                </div>
                            </label>
                        </div>
                        <div className="text-xs text-center text-gray-500">
                            Choose File
                        </div>
                    </div>
                </FormControl>
                <FormMessage />
            </FormItem>
        </div>
    )
}
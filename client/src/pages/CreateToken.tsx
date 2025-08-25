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
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import TransactionComponent from "@/components/Transaction"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    ticker: z.string().min(2, {
        message: "Ticker must be at least 3 characters.",
    }),
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

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            ticker: '',
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
        <div className="p-4 max-w-xl mx-auto" data-testid="page-create-token">
            <h1 className="text-2xl font-bold mb-4">Launch Your Token</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                Create and launch your own token with a built-in bonding curve. No coding required!
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Token Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Token Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., My Awesome Token" {...field} />
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
                                        <FormLabel>Token Symbol</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., MAT" {...field} />
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
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Describe your token and its purpose" 
                                                {...field} 
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="imageUri"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Token Image URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/image.png (Optional)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="twitter"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Twitter Handle</FormLabel>
                                        <FormControl>
                                            <Input placeholder="@yourhandle (Optional)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="discord"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Discord</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Discord invite link (Optional)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end pt-4 border-t">
                                <TransactionComponent
                                    contractAddress={UNIPUMP_CREATOR_ADDRESS}
                                    contractAbi={UniPumpCreatorAbi}
                                    cta="Launch Token"
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
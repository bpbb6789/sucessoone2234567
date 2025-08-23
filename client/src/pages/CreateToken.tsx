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

    const args = [form.watch('name'), form.watch('ticker'), form.watch('twitter'), form.watch('discord'), form.watch('description'), form.watch('imageUri')]

    return (
        <div className="p-4 max-w-2xl mx-auto" data-testid="page-create-token">
            <h1 className="text-3xl font-bold mb-6">Launch Your Token</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                Create and launch your own token with a built-in bonding curve. No coding required!
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Token Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                                rows={4}
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

                            <div className="flex justify-end pt-6 border-t">
                                <TransactionComponent
                                    contractAddress={UNIPUMP_CREATOR_ADDRESS}
                                    contractAbi={UniPumpCreatorAbi}
                                    cta="Launch Token"
                                    functionName="createTokenSale"
                                    handleOnStatus2={async () => {
                                        queryClient.invalidateQueries({ queryKey: ["getAllSales"] })
                                        
                                        // Save token to database after successful blockchain transaction
                                        try {
                                            const tokenData = {
                                                name: form.getValues('name'),
                                                symbol: form.getValues('ticker'),
                                                bio: form.getValues('description'),
                                                imageUri: form.getValues('imageUri') || '',
                                                memeTokenAddress: '', // This would be set from the transaction receipt
                                                createdBy: '', // This would be set from the connected wallet
                                                twitter: form.getValues('twitter') || '',
                                                discord: form.getValues('discord') || '',
                                                isUSDCToken0: false, // Default value
                                                marketCap: '0',
                                                price: '0',
                                                volume24h: '0',
                                                holders: 0
                                            };
                                            
                                            await fetch('/api/tokens', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(tokenData)
                                            });
                                        } catch (error) {
                                            console.error('Failed to save token to database:', error);
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
import { UniPumpCreatorAbi } from "@/abi/UniPumpCreatorAbi"
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
import TransactionComponent from "./Transaction"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Textarea } from "./ui/textarea"

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

const CreateToken = ({
    children,
}: {
    children: React.ReactNode,
}) => {
    const queryClient = useQueryClient()
    const searchParams = useSearchParams()

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    const args = [form.watch('name'), form.watch('ticker'), form.watch('twitter'), form.watch('discord'), form.watch('description'), form.watch('imageUri')]
    console.log("args", args);

    return (
        <Dialog onOpenChange={(open) => {
            if (!open) {
                form.reset()
            }
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Channel Coin</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
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
                                    <FormLabel>Ticker</FormLabel>
                                    <FormControl>
                                        <Input placeholder="TOKEN" {...field} />
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
                                        <Textarea placeholder="Brief description" {...field} rows={2} />
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
                                    <FormLabel>Twitter</FormLabel>
                                    <FormControl>
                                        <Input placeholder="@username" {...field} />
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
                                        <Input placeholder="discord.gg/invite" {...field} />
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
                                    <FormLabel>Image</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Image URL" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end ">
                            <div className="h-[20px]"></div>
                            <TransactionComponent
                                contractAddress={UNIPUMP_CREATOR_ADDRESS}
                                contractAbi={UniPumpCreatorAbi}
                                cta="Create Token"
                                functionName="createTokenSale"
                                handleOnStatus2={() => {
                                    queryClient.invalidateQueries({ queryKey: ["getAllSales"] })
                                }}
                                args={args}
                            />
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateToken
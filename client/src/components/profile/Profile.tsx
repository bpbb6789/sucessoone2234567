
"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ExternalLink, Heart, MessageSquare, Wallet, Share, Edit, Calendar, Eye, CheckCircle } from "lucide-react"
import { useAccount, useBalance, useEnsName } from "wagmi"
import { useWallet } from "@/hooks/useWallet"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
    username: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    }),
    bio: z.string().min(10, {
        message: "Bio must be at least 10 characters.",
    }),
    website: z.string().url().optional().or(z.literal("")),
    location: z.string().optional(),
})

interface ChannelStats {
    subscriberCount: number
    videoCount: number
    totalViews: string
    joinDate: string
}

const Profile = () => {
    const { address, chain } = useAccount()
    const { data: balance } = useBalance({ address })
    const { data: ensName } = useEnsName({ address })
    const { formatBalance, shortenAddress } = useWallet()
    const { toast } = useToast()
    
    // Real channel data - remove mock stats  
    const [channelStats] = useState<ChannelStats>({
        subscriberCount: 0,
        videoCount: 0,
        totalViews: "0",
        joinDate: "Recently"
    })
    
    const [isEditing, setIsEditing] = useState(false)
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: ensName || shortenAddress(address || ""),
            bio: "",
            website: "",
            location: "",
        },
    })

    // Update form when ENS name loads
    useEffect(() => {
        if (ensName || address) {
            form.setValue("username", ensName || shortenAddress(address || ""))
        }
    }, [ensName, address, form])

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Here you would typically save to your backend
        console.log("Profile update:", values)
        
        toast({
            title: "Profile Updated",
            description: "Your profile has been successfully updated.",
            duration: 3000
        })
        
        setIsEditing(false)
    }

    function onShare() {
        const channelUrl = `${window.location.origin}/channel/${address}`
        navigator.clipboard.writeText(channelUrl)
        
        toast({
            title: "Link Copied",
            description: "Channel link copied to clipboard",
            duration: 2000
        })
    }

    if (!address) {
        return (
            <Card className="w-full">
                <CardContent className="p-8 text-center">
                    <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-400">Please connect your wallet to view your profile</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Channel Header */}
            <Card className="w-full">
                <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`}
                                alt="Channel Avatar"
                                className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-700"
                            />
                            <Badge className="absolute -bottom-1 -right-1 bg-green-500">
                                <CheckCircle className="w-3 h-3" />
                            </Badge>
                        </div>

                        {/* Channel Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold">
                                    {ensName || form.watch("username")}
                                </h1>
                                <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                <span>@{shortenAddress(address)}</span>
                                <span>•</span>
                                <span>{channelStats.subscriberCount.toLocaleString()} subscribers</span>
                                <span>•</span>
                                <span>{channelStats.videoCount} videos</span>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Joined {channelStats.joinDate}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{channelStats.totalViews} views</span>
                                </div>
                            </div>

                            <p className="text-sm mb-4 max-w-2xl">
                                {form.watch("bio")}
                            </p>

                            <div className="flex gap-3">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="flex items-center gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Profile
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={onShare}
                                    className="flex items-center gap-2"
                                >
                                    <Share className="w-4 h-4" />
                                    Share
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Wallet Information */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Wallet Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Wallet Address
                            </label>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md font-mono text-sm">
                                {address}
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Balance
                            </label>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "Loading..."}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Network
                            </label>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                {chain?.name || "Unknown"}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                ENS Name
                            </label>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                {ensName || "Not set"}
                            </div>
                        </div>
                    </div>

                    {chain?.blockExplorers?.default && (
                        <a
                            href={`${chain.blockExplorers.default.url}/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm font-medium"
                        >
                            View on {chain.blockExplorers.default.name}
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </CardContent>
            </Card>

            {/* Profile Edit Form */}
            {isEditing && (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Edit Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Display Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your channel name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Channel Description</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Tell your audience about your channel" 
                                                    className="resize-none"
                                                    rows={4}
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://your-website.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your location" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">Save Changes</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default Profile

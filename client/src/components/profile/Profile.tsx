
"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ExternalLink, Heart, MessageSquare, Wallet } from "lucide-react"
import { useAccount } from "wagmi"
import Image from "next/image"

const formSchema = z.object({
    username: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    }),
    bio: z.string().min(2, {
        message: "Bio must be at least 10 characters.",
    }),
})

const Profile = () => {
    const { address, chain } = useAccount()
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            bio: "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values)
    }

    return (
        <div className="space-y-6">
            {/* Crypto Profile Section */}
            {address && (
                <Card className="w-full relative z-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5" />
                            Wallet Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Image
                                    src={'https://pump.mypinata.cloud/ipfs/QmeSzchzEPqCU1jwTnsipwcBAeH7S4bmVvFGfF65iA1BY1?img-width=128&img-dpr=2&img-onerror=redirects'}
                                    alt="Profile"
                                    width={48}
                                    height={48}
                                    className="rounded-full w-12 h-12"
                                />
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{address}</h3>
                                    <p className="text-sm text-gray-400">0 followers</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex space-x-4">
                            <div className="flex items-center">
                                <Heart className="w-5 h-5 text-red-500 mr-2" />
                                <span className="text-red-500 mr-1">Likes received:</span>
                                <span>0</span>
                            </div>
                            <div className="flex items-center">
                                <MessageSquare className="w-5 h-5 text-green-500 mr-2" />
                                <span className="text-green-500 mr-1">Mentions received:</span>
                                <span>0</span>
                            </div>
                        </div>
                        
                        <div className="bg-gray-800 p-3 rounded-md overflow-hidden">
                            <p className="text-sm font-mono truncate">
                                {address}
                            </p>
                        </div>
                        
                        {chain?.blockExplorers?.default && (
                            <a
                                href={chain.blockExplorers.default.url + "/address/" + address}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-end"
                            >
                                View on {chain.blockExplorers.default.name}
                                <ExternalLink className="w-4 h-4 ml-1" />
                            </a>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Profile Form Section */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Memer" {...field} />
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
                                        <FormLabel>Bio</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Type your bio here." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end mt-6">
                                <Button type="submit">Save Profile</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

export default Profile

"use client";

import { UniPumpCreatorAbi } from "@/abi/UniPumpCreatorAbi";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UNIPUMP_CREATOR_ADDRESS } from "@/lib/addresses";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import TransactionComponent from "@/components/Transaction";
import { Textarea } from "@/components/ui/textarea";

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
});

export default function CreateTokenPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

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
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    queryClient.invalidateQueries({ queryKey: ["getAllSales"] });
  }

  useEffect(() => {
    const searchTicker = searchParams.get('ticker');
    if (searchTicker) {
      form.setValue('ticker', searchTicker);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const args = [form.watch('name'), form.watch('ticker'), form.watch('twitter'), form.watch('discord'), form.watch('description'), form.watch('imageUri')];
  console.log("args", args);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#23234b] to-[#0f3460] py-20">
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-800">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">Create Channel Coin</h1>
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
                  queryClient.invalidateQueries({ queryKey: ["getAllSales"] });
                }}
                args={args}
              />
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

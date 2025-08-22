"use client";

import { CryptoProfile } from "@/components/crypto-profile";
import { CryptoTabs } from "@/components/crypto-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { Avatar } from "@coinbase/onchainkit/identity";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, BarChart2, Coins, Package, Rocket } from "lucide-react";
import useGetAllSales from "@/hooks/useGetAllSales";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ProfilePage = () => {
  const { data: tokens } = useGetAllSales();
  const { address } = useAccount();

  // Calculate stats
  interface Token {
    createdBy: string;
    volume: bigint;
    symbol: string;
    timestamp: string;
  }
  
  const userTokens = (tokens as Token[] | undefined)?.filter(t => t.createdBy?.toLowerCase() === address?.toLowerCase()) || [];
  const totalVolume = userTokens.reduce((acc: number, t: Token) => acc + (parseFloat(formatEther(t.volume || BigInt(0)))), 0);
  const tokensCreated = userTokens.length;
  const points = tokensCreated * 100; // Example points calculation

  const stats = [
    {
      title: "Tokens Created",
      value: tokensCreated,
      description: "Total tokens launched",
      icon: Package,
      color: "text-blue-500"
    },
    {
      title: "Total Volume",
      value: `${totalVolume.toFixed(2)} ETH`,
      description: "Across all tokens",
      icon: BarChart2,
      color: "text-green-500"
    },
    {
      title: "Ranking",
      value: "#" + (tokensCreated > 0 ? tokensCreated * 7 : "---"),
      description: "Creator ranking",
      icon: Rocket,
      color: "text-purple-500"
    },
    {
      title: "Points Earned",
      value: points,
      description: "Trading & creating",
      icon: Coins,
      color: "text-yellow-500"
    },
  ];

  return (
    <div className="min-h-screen bg-site-main">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Profile Card - Enhanced version of CryptoProfile */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="pt-6">
                <CryptoProfile />
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="text-sm font-medium text-zinc-200">{stat.title}</CardTitle>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-zinc-400">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Enhanced Tabs Section */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-0">
              <CryptoTabs />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="#" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View All <ArrowUpRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userTokens.slice(0, 5).map((token: Token, i: number) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Badge className="bg-green-600">Created</Badge>
                      </TableCell>
                      <TableCell className="font-medium">${token.symbol}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(Number(token.timestamp) * 1000).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
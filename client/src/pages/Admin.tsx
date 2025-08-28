
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, 
  Users, 
  Coins, 
  TrendingUp, 
  DollarSign, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  totalChannels: number;
  totalContentCoins: number;
  totalRevenue: string;
  totalFees: string;
  monthlyActiveUsers: number;
  pendingWithdrawals: string;
}

interface AdminUser {
  id: string;
  address: string;
  channelsCreated: number;
  coinsCreated: number;
  totalVolume: string;
  status: 'active' | 'suspended' | 'banned';
  joinedAt: string;
}

interface AdminChannel {
  id: string;
  name: string;
  ticker: string;
  owner: string;
  coinAddress: string;
  status: string;
  holders: number;
  marketCap: string;
  createdAt: string;
}

interface AdminContentCoin {
  id: string;
  title: string;
  coinName: string;
  coinSymbol: string;
  creatorAddress: string;
  status: string;
  likes: number;
  comments: number;
  deploymentTxHash?: string;
  createdAt: string;
}

export default function Admin() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Admin authentication
  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') { // In production, use proper auth
      setIsAuthenticated(true);
      toast.success('Admin authenticated successfully');
    } else {
      toast.error('Invalid admin password');
    }
  };

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Fetch channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery<AdminChannel[]>({
    queryKey: ['/api/admin/channels'],
    queryFn: async () => {
      const response = await fetch('/api/admin/channels');
      if (!response.ok) throw new Error('Failed to fetch channels');
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Fetch content coins
  const { data: contentCoins = [], isLoading: coinsLoading } = useQuery<AdminContentCoin[]>({
    queryKey: ['/api/admin/content-coins'],
    queryFn: async () => {
      const response = await fetch('/api/admin/content-coins');
      if (!response.ok) throw new Error('Failed to fetch content coins');
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Withdraw fees mutation
  const withdrawFees = useMutation({
    mutationFn: async (amount: string) => {
      const response = await fetch('/api/admin/withdraw-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error('Failed to withdraw fees');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Fees withdrawn successfully');
    },
    onError: () => {
      toast.error('Failed to withdraw fees');
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400">Manage your Web3 platform</p>
          </div>
          <Button
            onClick={() => {
              setIsAuthenticated(false);
              setAdminPassword('');
            }}
            variant="outline"
          >
            Logout
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Channels</p>
                    <p className="text-2xl font-bold">{stats.totalChannels.toLocaleString()}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Content Coins</p>
                    <p className="text-2xl font-bold">{stats.totalContentCoins.toLocaleString()}</p>
                  </div>
                  <Coins className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold">{stats.totalRevenue} ETH</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Management Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="coins">Content Coins</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Channel Created</Badge>
                      <span className="text-sm text-gray-400">New channel "VITACHANHGT" created</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Coin Deployed</Badge>
                      <span className="text-sm text-gray-400">Content coin deployed successfully</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">User Joined</Badge>
                      <span className="text-sm text-gray-400">New user registered</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Active Users (24h)</span>
                      <Badge variant="outline">{stats?.monthlyActiveUsers || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Platform Fees</span>
                      <Badge variant="outline">{stats?.totalFees || '0'} ETH</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pending Withdrawals</span>
                      <Badge variant="outline">{stats?.pendingWithdrawals || '0'} ETH</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">User Management</h2>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Users
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Address</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Coins Created</TableHead>
                      <TableHead>Total Volume</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono">
                          {user.address.slice(0, 6)}...{user.address.slice(-4)}
                        </TableCell>
                        <TableCell>{user.channelsCreated}</TableCell>
                        <TableCell>{user.coinsCreated}</TableCell>
                        <TableCell>{user.totalVolume} ETH</TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.status === 'active' ? 'default' : 'destructive'}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Channel Management</h2>
              <Button onClick={() => setShowCreateChannel(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Channel
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Market Cap</TableHead>
                      <TableHead>Holders</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell className="font-semibold">{channel.name}</TableCell>
                        <TableCell>{channel.ticker}</TableCell>
                        <TableCell className="font-mono">
                          {channel.owner.slice(0, 6)}...{channel.owner.slice(-4)}
                        </TableCell>
                        <TableCell>{channel.marketCap} ETH</TableCell>
                        <TableCell>{channel.holders}</TableCell>
                        <TableCell>
                          <Badge variant="default">{channel.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coins" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Content Coin Management</h2>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Coin Name</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentCoins.map((coin) => (
                      <TableRow key={coin.id}>
                        <TableCell className="font-semibold">{coin.title}</TableCell>
                        <TableCell>{coin.coinName}</TableCell>
                        <TableCell>{coin.coinSymbol}</TableCell>
                        <TableCell className="font-mono">
                          {coin.creatorAddress.slice(0, 6)}...{coin.creatorAddress.slice(-4)}
                        </TableCell>
                        <TableCell>{coin.likes}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={coin.status === 'deployed' ? 'default' : 'secondary'}
                          >
                            {coin.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Total Platform Fees</span>
                      <span className="font-bold">{stats?.totalFees || '0'} ETH</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Channel Creation Fees</span>
                      <span className="font-bold">0.05 ETH</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Trading Fees (2.5%)</span>
                      <span className="font-bold">{stats?.totalRevenue || '0'} ETH</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fee Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="withdrawAmount">Withdraw Amount (ETH)</Label>
                    <Input
                      id="withdrawAmount"
                      type="number"
                      placeholder="0.0"
                    />
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => withdrawFees.mutate('0.1')}
                    disabled={withdrawFees.isPending}
                  >
                    {withdrawFees.isPending ? 'Processing...' : 'Withdraw Fees'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="channelFee">Channel Creation Fee (ETH)</Label>
                  <Input id="channelFee" type="number" defaultValue="0.05" />
                </div>
                <div>
                  <Label htmlFor="tradingFee">Trading Fee Percentage</Label>
                  <Input id="tradingFee" type="number" defaultValue="2.5" />
                </div>
                <div>
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input id="maxFileSize" type="number" defaultValue="10" />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Channel Dialog */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="channelName">Channel Name</Label>
              <Input id="channelName" placeholder="Enter channel name" />
            </div>
            <div>
              <Label htmlFor="channelTicker">Ticker Symbol</Label>
              <Input id="channelTicker" placeholder="e.g., CHAN" />
            </div>
            <div>
              <Label htmlFor="ownerAddress">Owner Address</Label>
              <Input id="ownerAddress" placeholder="0x..." />
            </div>
            <Button className="w-full">Create Channel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

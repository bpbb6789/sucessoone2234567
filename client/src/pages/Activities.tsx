
import { Activity, Clock, TrendingUp, ArrowUpDown, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/constants";

interface ActivityItem {
  id: string;
  type: 'trade' | 'create' | 'transfer' | 'liquidity';
  title: string;
  description: string;
  timestamp: Date;
  amount?: string;
  token?: string;
  status: 'completed' | 'pending' | 'failed';
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'trade',
    title: 'Token Purchase',
    description: 'Bought UNIHOOK tokens',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    amount: '0.1 ETH',
    token: 'UNIHOOK',
    status: 'completed'
  },
  {
    id: '2',
    type: 'create',
    title: 'Token Created',
    description: 'Created UNIFROG token',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    token: 'UNIFROG',
    status: 'completed'
  },
  {
    id: '3',
    type: 'trade',
    title: 'Token Sale',
    description: 'Sold TESTBOY4567 tokens',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    amount: '0.05 ETH',
    token: 'TESTBOY4567',
    status: 'completed'
  },
  {
    id: '4',
    type: 'transfer',
    title: 'Token Transfer',
    description: 'Received UNIDOGE tokens',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    amount: '1000 UNIDOGE',
    token: 'UNIDOGE',
    status: 'completed'
  }
];

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'trade':
      return <ArrowUpDown className="h-4 w-4" />;
    case 'create':
      return <Coins className="h-4 w-4" />;
    case 'transfer':
      return <TrendingUp className="h-4 w-4" />;
    case 'liquidity':
      return <Activity className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getStatusColor = (status: ActivityItem['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export default function Activities() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Activities</h1>
      </div>

      <div className="space-y-4">
        {mockActivities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-medium">{activity.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.description}
                    </p>
                    {activity.amount && (
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {activity.amount}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Badge 
                    variant="secondary" 
                    className={getStatusColor(activity.status)}
                  >
                    {activity.status}
                  </Badge>
                  {activity.token && (
                    <span className="text-xs text-gray-500 font-mono">
                      {activity.token}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockActivities.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Activities Yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your trading and token activities will appear here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

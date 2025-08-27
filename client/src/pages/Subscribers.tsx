
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Users, Calendar } from "lucide-react";

interface Subscriber {
  id: string;
  subscriberChannelId: string;
  subscribedToChannelId: string;
  createdAt: string;
  subscriber: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string;
  };
}

export default function Subscribers() {
  const { channelId } = useParams();

  const { data: subscribers = [], isLoading, error } = useQuery<Subscriber[]>({
    queryKey: ["/api/subscriptions", channelId],
    enabled: !!channelId,
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions/${channelId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscribers');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Subscribers</h1>
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg animate-pulse">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Subscribers</h1>
        <div className="text-center py-8">
          <p className="text-red-500">Failed to load subscribers. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Subscribers</h1>
        <span className="text-gray-500">({subscribers.length})</span>
      </div>

      {subscribers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            No subscribers yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start creating great content to attract subscribers!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscribers.map((subscription) => (
            <div 
              key={subscription.id} 
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={subscription.subscriber.avatarUrl}
                  alt={subscription.subscriber.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {subscription.subscriber.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{subscription.subscriber.handle}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {new Date(subscription.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { getCustomerActivities } from '@/app/crm/utils/activityLogger';
import { ActivityLog } from '@/app/crm/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface ActivityFeedProps {
  customerId: string;
}

/**
 * ActivityFeed component displays a chronological list of recent customer activities.
 * It fetches activities for a specific customer and presents them in a readable format.
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({ customerId }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const customerActivities = await getCustomerActivities(customerId);
      setActivities(customerActivities);
    } catch (err: unknown) {
      console.error('Failed to fetch customer activities:', err);
      setError(
        `Failed to load activities: ${(err as Error).message || 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchActivities();
    }
  }, [customerId, fetchActivities]);

  if (loading) {
    return <div>Loading activities...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>Customer Activity Feed</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        {activities.length === 0 ? (
          <div className="p-4 text-muted-foreground">
            No activities recorded for this customer.
          </div>
        ) : (
          <ScrollArea className="h-full w-full">
            <ul className="divide-y divide-border">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium capitalize">
                      {activity.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(activity.timestamp, 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

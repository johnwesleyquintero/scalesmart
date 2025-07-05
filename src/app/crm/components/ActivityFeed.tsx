import React, { useEffect, useState } from 'react';
import { getCustomerActivities } from '@/app/crm/utils/activityLogger';
import { ActivityLog, ActivityType } from '@/app/crm/types'; // Import ActivityType
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import {
  Mail,
  Globe,
  FileText,
  LifeBuoy,
  Package,
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  RefreshCw,
  Trash2,
  DollarSign,
} from 'lucide-react'; // Import relevant icons

interface ActivityFeedProps {
  customerId: string;
}

// Helper to map activity types to display names and icons
const activityTypeMap: Record<
  ActivityType,
  { name: string; icon: React.ElementType }
> = {
  email_open: { name: 'Email Opened', icon: Mail },
  website_visit: { name: 'Website Visit', icon: Globe },
  form_submission: { name: 'Form Submission', icon: FileText },
  support_ticket_update: { name: 'Support Ticket Update', icon: LifeBuoy },
  product_usage: { name: 'Product Usage', icon: Package },
  customer_created: { name: 'Customer Created', icon: UserPlus },
  customer_updated: { name: 'Customer Updated', icon: UserCheck },
  customer_deleted: { name: 'Customer Deleted', icon: UserX },
  communication_logged: { name: 'Communication Logged', icon: MessageSquare },
  communication_updated: { name: 'Communication Updated', icon: RefreshCw },
  communication_deleted: { name: 'Communication Deleted', icon: Trash2 },
  sales_opportunity_created: { name: 'Opportunity Created', icon: DollarSign },
  sales_opportunity_updated: { name: 'Opportunity Updated', icon: DollarSign },
  sales_opportunity_deleted: { name: 'Opportunity Deleted', icon: Trash2 },
};

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
                  className="p-4 hover:bg-accent/50 transition-colors flex items-start space-x-3"
                >
                  <div className="flex-shrink-0 mt-1">
                    {React.createElement(
                      activityTypeMap[activity.type]?.icon || Mail,
                      { className: 'h-5 w-5 text-primary' },
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">
                        {activityTypeMap[activity.type]?.name ||
                          activity.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(activity.timestamp, 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

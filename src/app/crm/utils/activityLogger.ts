import { createActivityLog, getAllActivityLogs } from '@/lib/indexeddb/crm-db';
import { ActivityType, ActivityLog } from '@/app/crm/types';

/**
 * Logs a customer activity to the database.
 * @param customerId The ID of the customer associated with the activity.
 * @param type The type of activity (e.g., 'email_open', 'website_visit').
 * @param description A detailed description of the activity.
 * @returns A promise that resolves when the activity is logged.
 */
export async function logActivity(
  customerId: string,
  type: ActivityType,
  description: string,
): Promise<void> {
  const newActivity: Omit<ActivityLog, 'id'> = {
    contactId: customerId,
    type,
    description,
    timestamp: Date.now(),
  };
  await createActivityLog(newActivity);
}

/**
 * Retrieves all activity logs for a specific customer, sorted by timestamp in descending order.
 * @param customerId The ID of the customer to retrieve activities for.
 * @returns A promise resolving with an array of ActivityLog objects.
 */
export async function getCustomerActivities(
  customerId: string,
): Promise<ActivityLog[]> {
  const allActivities = await getAllActivityLogs();
  return allActivities
    .filter((activity) => activity.contactId === customerId)
    .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
}

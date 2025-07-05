import { getUnsyncedItems, markItemAsSynced } from './indexeddb-service';
import {
  Note,
  Task,
  Project,
  AmazonReport,
  ChatMessageRecord,
  Category,
} from '@/types/indexeddb';
import {
  Contact,
  CommunicationLog,
  ActivityLog,
  SalesOpportunity,
  EmailTemplate,
} from '@/app/crm/types';

// Define all stores that contain syncable data
const SYNCABLE_STORES = [
  { name: 'markdownNotes', type: 'Note' },
  { name: 'crmContacts', type: 'Contact' },
  { name: 'crmCommunicationLogs', type: 'CommunicationLog' },
  { name: 'crmActivityLogs', type: 'ActivityLog' },
  { name: 'crmSalesOpportunities', type: 'SalesOpportunity' },
  { name: 'tasks', type: 'Task' },
  { name: 'projects', type: 'Project' },
  { name: 'amazonReports', type: 'AmazonReport' },
  { name: 'chatMessages', type: 'ChatMessageRecord' },
  { name: 'crmCategories', type: 'Category' },
  { name: 'crmEmailTemplates', type: 'EmailTemplate' },
];

export const syncOfflineData = async () => {
  console.log('Checking for unsynced data across all stores...');
  let totalUnsyncedItems = 0;

  for (const storeInfo of SYNCABLE_STORES) {
    try {
      // Use a type assertion to ensure TypeScript knows the type of items
      const unsyncedItems = await getUnsyncedItems<
        | Note
        | Contact
        | CommunicationLog
        | ActivityLog
        | SalesOpportunity
        | Task
        | Project
        | AmazonReport
        | ChatMessageRecord
        | Category
        | EmailTemplate
      >(storeInfo.name); // No change needed here, as the types themselves are now updated to use number for synced

      if (unsyncedItems.length === 0) {
        console.log(`No unsynced items in store: ${storeInfo.name}`);
        continue;
      }

      totalUnsyncedItems += unsyncedItems.length;
      console.log(
        `Found ${unsyncedItems.length} unsynced items in store: ${storeInfo.name}. Attempting to sync...`,
      );

      for (const item of unsyncedItems) {
        try {
          if (item.id !== undefined) {
            await markItemAsSynced(
              storeInfo.name,
              item as { id: string | number; synced?: number }, // Changed boolean to number
            );
          } else {
            console.warn(
              `Skipping sync for item in store "${storeInfo.name}" due to undefined ID:`,
              item,
            );
          }
        } catch (error) {
          console.error(
            `Error simulating sync for item (ID: ${item.id}) in store "${storeInfo.name}":`,
            error,
          );
          // Continue to next item/store even if one fails, or implement retry logic
        }
      }
    } catch (error) {
      console.error(
        `Error accessing store "${storeInfo.name}" for unsynced items:`,
        error,
      );
    }
  }

  if (totalUnsyncedItems === 0) {
    console.log('No unsynced data found across all stores.');
  } else {
    console.log('Offline data synchronization attempt completed.');
  }
};

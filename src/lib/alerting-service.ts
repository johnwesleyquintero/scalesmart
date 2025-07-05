// src/lib/alerting-service.ts

import {
  DataQuery,
  QueryResult,
  DataSourceType,
} from '../app/dashboard-studio/data-source-types';
import { DataRefreshService } from './dashboard-service';
import { setItem, getItem, getAllItems, deleteItem } from './indexeddb-service';

// Define interfaces for alert rules and notifications
export interface AlertRule {
  id: string;
  name: string;
  query: DataQuery; // The data to monitor
  condition: AlertCondition; // The condition to evaluate
  notification: AlertNotification; // The notification to trigger
  isActive: boolean;
}

export interface AlertCondition {
  type: 'threshold' | 'anomaly' | 'custom'; // Example condition types
  config: Record<string, unknown>; // Configuration for the condition
}

export interface AlertNotification {
  type: 'in-app' | 'email' | 'webhook'; // Example notification types
  config: Record<string, unknown>; // Configuration for the notification
}

const ALERT_RULES_STORE_NAME = 'alertRules';

// In-memory storage for active alert rules and their monitoring processes
const activeAlerts: Map<
  string,
  { rule: AlertRule; stopMonitoring: () => void }
> = new Map();

export const AlertingService = {
  // Method to create or update an alert rule
  async saveAlertRule(rule: AlertRule): Promise<void> {
    console.log('Saving alert rule:', rule);
    await setItem<AlertRule>(ALERT_RULES_STORE_NAME, rule);

    // If the rule is active, start or restart monitoring
    if (rule.isActive) {
      this.startMonitoring(rule);
    } else {
      this.stopMonitoring(rule.id);
    }
  },

  // Method to delete an alert rule
  async deleteAlertRule(ruleId: string): Promise<void> {
    console.log('Deleting alert rule:', ruleId);
    await deleteItem(ALERT_RULES_STORE_NAME, ruleId);

    // Stop monitoring if active
    this.stopMonitoring(ruleId);
  },

  // Method to get an alert rule by ID
  async getAlertRule(ruleId: string): Promise<AlertRule | undefined> {
    console.log('Getting alert rule:', ruleId);
    return getItem<AlertRule>(ALERT_RULES_STORE_NAME, ruleId);
  },

  // Method to list all alert rules
  async listAlertRules(): Promise<AlertRule[]> {
    console.log('Listing alert rules');
    return getAllItems<AlertRule>(ALERT_RULES_STORE_NAME);
  },

  // Internal method to start monitoring an alert rule
  startMonitoring(rule: AlertRule): void {
    // Stop any existing monitoring for this rule
    if (activeAlerts.has(rule.id)) {
      activeAlerts.get(rule.id)!.stopMonitoring();
    }

    console.log('Starting monitoring for alert rule:', rule.name);

    let stopMonitoring: () => void;

    // For local applications, we'll assume scheduled refresh or direct data access
    // based on the query's connection type (e.g., IndexedDB, LocalCSV).
    // We will use DataRefreshService's startRealtimeDataStream for simplicity,
    // assuming it can handle both "streaming" (e.g., watching IndexedDB changes)
    // and scheduled fetches for local data sources.
    stopMonitoring = DataRefreshService.startRealtimeDataStream(
      rule.query,
      (data: QueryResult) => this.evaluateCondition(rule, data),
      (error: unknown) =>
        console.error(
          `Error in data stream for alert rule ${rule.name}:`,
          error as Error,
        ),
    );

    activeAlerts.set(rule.id, { rule, stopMonitoring });
  },

  // Internal method to stop monitoring an alert rule
  stopMonitoring(ruleId: string): void {
    if (activeAlerts.has(ruleId)) {
      console.log('Stopping monitoring for alert rule ID:', ruleId);
      activeAlerts.get(ruleId)!.stopMonitoring();
      activeAlerts.delete(ruleId);
    }
  },

  // Internal method to evaluate the alert condition
  evaluateCondition(rule: AlertRule, data: QueryResult): void {
    console.log(
      'Evaluating condition for alert rule:',
      rule.name,
      'with data:',
      data,
    );
    // Implement condition evaluation logic based on rule.condition
    let conditionMet = false;

    if (rule.condition.type === 'threshold') {
      // Example: Check if a value in the data exceeds a threshold
      const threshold = rule.condition.config.threshold as number; // Assert threshold as number
      const valueToCheck = data.rows?.[0]?.[0] as number; // Assert valueToCheck as number
      if (
        typeof valueToCheck === 'number' &&
        typeof threshold === 'number' &&
        valueToCheck > threshold
      ) {
        conditionMet = true;
      }
    }
    // ... other condition types

    if (conditionMet) {
      console.log('Alert condition met for rule:', rule.name);
      this.triggerNotification(rule, data);
    }
  },

  // Internal method to trigger the notification
  triggerNotification(rule: AlertRule, data: QueryResult): void {
    console.log(
      'Triggering notification for alert rule:',
      rule.name,
      'with data:',
      data,
    );
    // Implement notification logic based on rule.notification
    if (rule.notification.type === 'in-app') {
      console.log('Sending in-app notification.');
      // Implement in-app notification display
    } else if (rule.notification.type === 'email') {
      console.log(
        'Sending email notification to:',
        rule.notification.config.email,
      );
      // Implement email sending logic
    } else if (rule.notification.type === 'webhook') {
      console.log(
        'Sending webhook notification to:',
        rule.notification.config.url,
      );
      // Implement webhook sending logic (e.g., using fetch or a library)
    }
    // ... other notification types
  },
};

export type SalesStage =
  | 'Lead'
  | 'Prospect'
  | 'Qualified'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

export interface SalesOpportunity {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  amount: number;
  stage: SalesStage;
  closeDate: number; // Timestamp
  notes?: string;
  lastActivity?: number; // Timestamp of last interaction
  synced?: number; // New property to track sync status (0 for unsynced, 1 for synced)
}

export const SALES_STAGES_ORDER: SalesStage[] = [
  'Lead',
  'Prospect',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];

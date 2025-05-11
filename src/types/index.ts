export interface AppEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}

export type { Education, Experience } from '../lib/types';

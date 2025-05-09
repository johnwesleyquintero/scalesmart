import { createClient } from '@supabase/supabase-js';

export interface KeywordTrend {
  id?: string;
  keyword: string;
  date: string;
  volume: number;
  created_at: string;
}

export interface KeywordTrendData {
  name: string;
  [keyword: string]: number | string;
}

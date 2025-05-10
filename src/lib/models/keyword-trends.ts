import { ObjectId } from 'mongodb';

export interface KeywordTrend {
  _id?: ObjectId;
  keyword: string;
  date: string;
  volume: number;
  createdAt: Date;
}

export interface KeywordTrendData {
  name: string;
  [keyword: string]: number | string;
}

export const KeywordTrendCollection = 'keyword-trends';

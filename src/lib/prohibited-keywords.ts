import { loadStaticData } from './load-static-data';

let prohibitedKeywords: Set<string> = new Set();

async function initialize() {
  const data = (await loadStaticData('prohibited-keywords')) as string[];
  prohibitedKeywords = new Set(data);
}

initialize();

export async function getAll(): Promise<string[]> {
  return Array.from(prohibitedKeywords);
}

export function isProhibited(keyword: string): boolean {
  return prohibitedKeywords.has(keyword.toLowerCase());
}

export function add(keyword: string) {
  prohibitedKeywords.add(keyword.toLowerCase());
  return prohibitedKeywords;
}

export const ProhibitedKeywordsUtil = {
  getAll,
  add,
  isProhibited,
};

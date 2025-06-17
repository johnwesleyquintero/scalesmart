import { loadStaticData } from './load-static-data';

let prohibitedKeywords: string[] = [];

async function initialize() {
  prohibitedKeywords = (await loadStaticData(
    'prohibited-keywords',
  )) as string[];
}

initialize();

export async function getAll(): Promise<string[]> {
  return prohibitedKeywords;
}

export function isProhibited(keyword: string): boolean {
  return prohibitedKeywords.includes(keyword.toLowerCase());
}

export async function add(): Promise<void> {}

export const ProhibitedKeywordsUtil = {
  getAll,
  add,
  isProhibited,
};

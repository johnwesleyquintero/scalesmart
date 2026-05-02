let prohibitedKeywords: Set<string> = new Set();

async function initialize() {
  // Static data removed. Defaulting to empty set.
  prohibitedKeywords = new Set();
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

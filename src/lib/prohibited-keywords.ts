export async function getAll(): Promise<string[]> {
  console.log('getAll called');
  return [];
}

export async function add(): Promise<void> {}

// Consider renaming this export for clarity if 'getAll' is the primary function used elsewhere
export const ProhibitedKeywords = {
  getAll,
  add,
  // Optional: Keep getKeywords if it's used elsewhere, but it's redundant with getAll
  // getKeywords: getAll,
};

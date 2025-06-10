import { ProductResearchData, KeywordTrackingData } from '@/types/amazon-tools';

/**
 * Filters Product Research data based on a search term.
 * Searches across product name, ASIN, brand, and category.
 * @param data An array of ProductResearchData objects.
 * @param searchTerm The term to search for (case-insensitive).
 * @returns An array of ProductResearchData objects that match the search term.
 */
export function filterProductResearchData(
  data: ProductResearchData[],
  searchTerm: string,
): ProductResearchData[] {
  if (!searchTerm) {
    return data; // Return all data if no search term is provided
  }

  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  return data.filter((item) => {
    // Check if the search term is included in relevant fields
    return (
      item.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      item.asin.toLowerCase().includes(lowerCaseSearchTerm) ||
      (item.brand && item.brand.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (item.category &&
        item.category.toLowerCase().includes(lowerCaseSearchTerm))
    );
  });
}

/**
 * Filters Keyword Tracking data based on a search term.
 * Searches across the keyword and competition fields.
 * @param data An array of KeywordTrackingData objects.
 * @param searchTerm The term to search for (case-insensitive).
 * @returns An array of KeywordTrackingData objects that match the search term.
 */
export function filterKeywordTrackingData(
  data: KeywordTrackingData[],
  searchTerm: string,
): KeywordTrackingData[] {
  if (!searchTerm) {
    return data; // Return all data if no search term is provided
  }

  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  return data.filter((item) => {
    // Check if the search term is included in relevant fields
    return (
      item.keyword.toLowerCase().includes(lowerCaseSearchTerm) ||
      (item.competition &&
        item.competition.toLowerCase().includes(lowerCaseSearchTerm))
    );
  });
}

// You can add more filtering functions here for other criteria (e.g., price range, review count)

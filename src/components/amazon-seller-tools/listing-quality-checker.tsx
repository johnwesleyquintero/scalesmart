// src/components/amazon-seller-tools/listing-quality-checker.tsx
'use client';

import { AlertCircle, Download, FileText, Info, X } from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useEffect, useState } from 'react';

// Local/UI Imports
import DataCard from '@/components/amazon-seller-tools/DataCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'; // Added Accordion components
import { Badge } from '@/components/ui/badge'; // Added Badge
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardHeader, CardTitle, CardDescription
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Lib/Logic Imports (Assuming KeywordIntelligence exists and works as expected)
// NOTE: KeywordIntelligence logic is simplified/mocked in processCSVRow

// --- Types ---

export interface CSVRow {
  // Defines the structure of a CSV row
  product: string; // Product name
  title: string; // Product title
  description: string;
  bullet_points: string; // Semicolon-separated
  images: string; // Should be a number string
  keywords: string; // Comma-separated
  asin?: string | undefined; // Optional ASIN field
}

export interface AsinData {
  // Defines the structure of ASIN data
  title: string; // Product title
  description: string[]; // Description from API might be an array
  bulletPoints: string[];
  imageCount: number;
  keywords: string[];
  brand?: string | undefined;
  category?: string | undefined;
  rating?: number | undefined;
  reviewCount?: number | undefined;
}

// NOTE: This depends on the actual KeywordIntelligence implementation
export type KeywordAnalysisResult = {
  // Defines the structure of a keyword analysis result
  keyword: string; // The keyword
  isProhibited: boolean; // Whether the keyword is prohibited
  score: number;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'pattern';
  reason?: string;
};

export interface ListingData {
  // Defines the structure of listing data
  product: string; // Product name
  title?: string; // Product title
  description?: string;
  bulletPoints?: string[];
  images?: number;
  keywords?: string[];
  keywordAnalysis?: KeywordAnalysisResult[]; // Result from KeywordIntelligence
  score: number; // Calculated score
  issues: string[]; // Detected problems
  suggestions: string[]; // Improvement ideas
  brand?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
}

// --- Constants ---

const REQUIRED_COLUMNS = [
  // Required columns in the CSV file
  'product', // Product name
  'title', // Product title
  'description',
  'bullet_points',
  'images',
  'keywords',
] as const;

// Scoring Weights
const WEIGHTS = {
  // Weights for each factor in the scoring calculation
  title: 20, // Weight for title
  description: 20, // Weight for description
  bulletPoints: 15,
  images: 15,
  keywords: 15,
  brand: 5,
  rating: 5,
  reviewCount: 5,
} as const;

// Thresholds for scoring
const MIN_TITLE_LENGTH = 50; // Minimum title length for scoring
const MAX_TITLE_LENGTH = 200; // Maximum title length for scoring
const MIN_DESCRIPTION_LENGTH = 500; // Minimum description length for scoring
const MAX_DESCRIPTION_LENGTH = 2000;
const MIN_BULLET_POINTS = 3;
const RECOMMENDED_BULLET_POINTS = 5;
const MIN_IMAGES = 3;
const RECOMMENDED_IMAGES = 7;
const MIN_KEYWORDS = 5;
const RECOMMENDED_KEYWORDS = 10;
const MIN_REVIEW_COUNT = 10;
const MIN_RATING = 3.5;

// --- Helper Functions ---

const validateCSVData = (results: Papa.ParseResult<CSVRow>) => {
  // Validates the CSV data
  if (results.errors.length > 0) {
    throw new Error(
      `CSV parsing errors: ${results.errors.map((e) => e.message).join(', ')}`,
    );
  }

  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !results.meta.fields?.includes(col),
  );
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }
};

type ListingScoreResult = Pick<ListingData, 'score' | 'issues' | 'suggestions'>;

// Helper functions to calculate scores for different aspects
const calculateTitleScore = (
  // Calculates the score for the title
  title: string | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let titleScore = 0;
  if (title) {
    if (title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH) {
      titleScore = WEIGHTS.title;
    } else if (title.length < MIN_TITLE_LENGTH) {
      issues.push(
        `Title too short (${title.length}/${MIN_TITLE_LENGTH} chars)`,
      );
      suggestions.push('Expand title with relevant keywords and key features.');
      titleScore = Math.floor(
        (title.length / MIN_TITLE_LENGTH) * WEIGHTS.title,
      );
    } else {
      issues.push(
        `Title exceeds maximum length (${title.length}/${MAX_TITLE_LENGTH} chars)`,
      );
      suggestions.push(
        'Optimize title length while maintaining key information.',
      );
      titleScore = Math.floor(
        (MAX_TITLE_LENGTH / title.length) * WEIGHTS.title,
      );
    }
  } else {
    issues.push('Missing product title');
    suggestions.push('Add a descriptive title with main keywords.');
  }
  return titleScore;
};

const calculateDescriptionScore = (
  // Calculates the score for the description
  description: string | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let descScore = 0;
  if (description) {
    if (
      description.length >= MIN_DESCRIPTION_LENGTH &&
      description.length <= MAX_DESCRIPTION_LENGTH
    ) {
      descScore = WEIGHTS.description;
    } else if (description.length < MIN_DESCRIPTION_LENGTH) {
      issues.push(
        `Description too short (${description.length}/${MIN_DESCRIPTION_LENGTH} chars)`,
      );
      suggestions.push('Expand description with detailed product information.');
      descScore = Math.floor(
        (description.length / MIN_DESCRIPTION_LENGTH) * WEIGHTS.description,
      );
    } else {
      issues.push(
        `Description exceeds recommended length (${description.length}/${MAX_DESCRIPTION_LENGTH} chars)`,
      );
      suggestions.push('Consider condensing while maintaining key details.');
      descScore = Math.floor(
        (MAX_DESCRIPTION_LENGTH / description.length) * WEIGHTS.description,
      );
    }
  } else {
    issues.push('Missing product description');
    suggestions.push('Add a comprehensive product description.');
  }
  return descScore;
};

const calculateBulletPointsScore = (
  // Calculates the score for the bullet points
  bulletPoints: string[] | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let bulletScore = 0;
  const bulletCount = bulletPoints?.length ?? 0;
  if (bulletCount >= RECOMMENDED_BULLET_POINTS) {
    bulletScore = WEIGHTS.bulletPoints;
  } else if (bulletCount >= MIN_BULLET_POINTS) {
    bulletScore = Math.floor(
      (bulletCount / RECOMMENDED_BULLET_POINTS) * WEIGHTS.bulletPoints,
    );
    suggestions.push(
      `Consider adding ${RECOMMENDED_BULLET_POINTS - bulletCount} more bullet points.`,
    );
  } else {
    issues.push(
      `Insufficient bullet points (${bulletCount}/${MIN_BULLET_POINTS} minimum)`,
    );
    suggestions.push(
      `Add at least ${MIN_BULLET_POINTS - bulletCount} more bullet points.`,
    );
    bulletScore =
      bulletCount > 0
        ? Math.floor((bulletCount / MIN_BULLET_POINTS) * WEIGHTS.bulletPoints)
        : 0;
  }
  return bulletScore;
};

const calculateImagesScore = (
  // Calculates the score for the images
  images: number | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let imageScore = 0;
  const imageCount = images ?? 0;
  if (imageCount >= RECOMMENDED_IMAGES) {
    imageScore = WEIGHTS.images;
  } else if (imageCount >= MIN_IMAGES) {
    imageScore = Math.floor((imageCount / RECOMMENDED_IMAGES) * WEIGHTS.images);
    suggestions.push(
      `Consider adding ${RECOMMENDED_IMAGES - imageCount} more images.`,
    );
  } else {
    issues.push(`Insufficient images (${imageCount}/${MIN_IMAGES} minimum)`);
    suggestions.push(
      `Add at least ${MIN_IMAGES - imageCount} more high-quality images.`,
    );
    imageScore =
      imageCount > 0
        ? Math.floor((imageCount / MIN_IMAGES) * WEIGHTS.images)
        : 0;
  }
  return imageScore;
};

const calculateKeywordsScore = (
  // Calculates the score for the keywords
  keywords: string[] | undefined,
  keywordAnalysis: KeywordAnalysisResult[] | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let keywordScore = 0;
  if (keywords && keywords.length > 0) {
    const keywordCount = keywords.length;
    if (keywordCount >= RECOMMENDED_KEYWORDS) {
      keywordScore = WEIGHTS.keywords;
    } else if (keywordCount >= MIN_KEYWORDS) {
      keywordScore = Math.floor(
        (keywordCount / RECOMMENDED_KEYWORDS) * WEIGHTS.keywords,
      );
      suggestions.push(
        `Consider adding ${RECOMMENDED_KEYWORDS - keywordCount} more relevant keywords.`,
      );
    } else {
      issues.push(
        `Insufficient keywords (${keywordCount}/${MIN_KEYWORDS} minimum)`,
      );
      suggestions.push(
        `Add at least ${MIN_KEYWORDS - keywordCount} more relevant keywords.`,
      );
      keywordScore = Math.floor(
        (keywordCount / MIN_KEYWORDS) * WEIGHTS.keywords,
      );
    }

    // Check for prohibited keywords
    const prohibitedCount =
      keywordAnalysis?.filter((k) => k.isProhibited).length ?? 0;
    if (prohibitedCount > 0) {
      issues.push(`Found ${prohibitedCount} prohibited keywords`);
      suggestions.push('Remove or replace prohibited keywords.');
      keywordScore = Math.max(0, keywordScore - prohibitedCount * 2);
    }
  } else {
    issues.push('Missing keywords');
    suggestions.push('Add relevant keywords to improve searchability.');
  }
  return keywordScore;
};

// Enhanced scoring logic with weighted factors and comprehensive checks
const calculateScoreAndIssues = (
  // Calculates the overall score and identifies issues
  data: Omit<ListingData, 'score' | 'issues' | 'suggestions'>,
): ListingScoreResult => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let totalScore = 0;

  // Title Analysis (20 points)
  totalScore += calculateTitleScore(data.title, issues, suggestions);

  // Description Analysis (20 points)
  totalScore += calculateDescriptionScore(
    data.description,
    issues,
    suggestions,
  );

  // Bullet Points Analysis (15 points)
  totalScore += calculateBulletPointsScore(
    data.bulletPoints,
    issues,
    suggestions,
  );

  // Images Analysis (15 points)
  totalScore += calculateImagesScore(data.images, issues, suggestions);

  // Keywords Analysis (15 points)
  totalScore += calculateKeywordsScore(
    data.keywords,
    data.keywordAnalysis,
    issues,
    suggestions,
  );

  // Brand and Category Bonus (5 points each)
  if (data.brand) totalScore += WEIGHTS.brand;
  else suggestions.push('Add brand information if applicable.');

  // Rating and Review Analysis (5 points each)
  if (data.rating && data.rating >= MIN_RATING) {
    totalScore += WEIGHTS.rating;
  } else if (data.rating) {
    issues.push(`Low product rating (${data.rating.toFixed(1)}/5.0)`);
    suggestions.push('Address common customer concerns to improve rating.');
  }

  if (data.reviewCount && data.reviewCount >= MIN_REVIEW_COUNT) {
    totalScore += WEIGHTS.reviewCount;
  } else if (data.reviewCount) {
    suggestions.push('Work on getting more customer reviews.');
  }

  return {
    score: Math.max(0, Math.min(100, totalScore)), // Ensure score is between 0 and 100
    issues: issues.length > 0 ? issues : [],
    suggestions: suggestions.length > 0 ? suggestions : [],
  };
};

const processCSVRow = async (row: CSVRow): Promise<ListingData> => {
  // Processes a single row of the CSV data
  const keywordsString = row.keywords;

  keywordsString?.split(',').filter(Boolean) || [];

  // Set the keywords state

  const images = Number(row.images);
  const bulletPoints =
    row.bullet_points
      ?.split(';')
      .map((s) => s.trim())
      .filter(Boolean) || [];

  // Basic validation within row processing
  if (isNaN(images)) {
    console.warn(`Invalid image count for product "${row.product}"`);
  }

  const baseData: Omit<ListingData, 'score' | 'issues' | 'suggestions'> = {
    product: row.product,
    title: row.title,
    description: row.description,
    bulletPoints,
    images: isNaN(images) ? 0 : images,
    keywords: [], // keywordData, // Use the fetched keyword data
    keywordAnalysis: [],
  };

  const analysis = calculateScoreAndIssues(baseData);

  return {
    ...baseData,
    ...analysis,
  };
};

// Extracted CSV parsing logic
const parseAndProcessCsv = (content: string): Promise<ListingData[]> => {
  // Parses the CSV data and processes each row
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(content, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          validateCSVData(results);
          if (results.data.length === 0) {
            throw new Error('CSV contains no valid data rows.');
          }
          // Process rows concurrently
          const processedData = await Promise.all(
            results.data.map(processCSVRow),
          );
          resolve(processedData);
        } catch (parseError) {
          reject(
            parseError instanceof Error
              ? parseError
              : new Error('An error occurred during CSV processing'),
          );
        }
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
};

const getBadgeVariant = (
  // Determines the badge variant based on the score
  score: number,
): 'default' | 'secondary' | 'destructive' => {
  if (score >= 80) {
    return 'default'; // Good (using 'default' as success)
  } else if (score >= 50) {
    return 'secondary'; // Fair
  } else {
    return 'destructive'; // Poor
  }
};

// --- Component ---

export default function ListingQualityChecker() {
  // Main component for listing quality checker
  const { toast } = useToast();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [asin, setAsin] = useState('');

  // Enhance scoring with weighted criteria
  // const calculateScore = (listing: ListingData) => { // Removed duplicate function
  //   // Add weights from real-world performance data
  //   const performanceWeights = {
  //     conversionRate: 0.4,
  //     clickThroughRate: 0.3,
  //     searchRanking: 0.3
  //   };
  //   return (
  //     listing.conversionRate * performanceWeights.conversionRate +
  //     listing.clickThroughRate * performanceWeights.clickThroughRate +
  //     listing.searchRanking * performanceWeights.searchRanking
  //   );
  // };


  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsLoading(true);
      setError(undefined); // Clear previous errors

      const file = event.target.files?.[0];
      if (!file) {
        setError('No file selected.');
        setIsLoading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const processedData = await parseAndProcessCsv(content);
          setListings(processedData);
          toast('', '', {
            title: 'Success',
            description: 'CSV file processed successfully'
          });
        } catch (parseError) {
          setError(
            parseError instanceof Error
              ? parseError.message
              : 'An error occurred during CSV processing',
          );
          toast('', '', {
            title: 'Error',
            description: 'Failed to process CSV file',
          });
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        setIsLoading(false);
        toast('', '', {
          title: 'File Reading Error',
          description: 'Could not read the selected file.',
        });
      };
      reader.readAsText(file);
    },
    [toast, setError, setIsLoading, setListings],
  );

  const fetchAsinDataMock = async (asin: string): Promise<AsinData> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock data - replace with actual API call
    return {
      title: `Mock Title for ASIN ${asin}`,
      description: [
        'Mock description line 1',
        'Mock description line 2',
        'Mock description line 3',
      ],
      bulletPoints: [
        'Mock bullet point 1',
        'Mock bullet point 2',
        'Mock bullet point 3',
      ],
      imageCount: 5,
      keywords: ['mock keyword 1', 'mock keyword 2', 'mock keyword 3'],
      brand: 'Mock Brand',
      category: 'Electronics',
      rating: 4.5,
      reviewCount: 150,
    };
  };

  const handleAsinCheck = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const asinData = await fetchAsinDataMock(asin);
      // Map ASIN data to ListingData format
      const listingData: ListingData = {
        product: asin,
        title: asinData.title,
        description: asinData.description.join('\n'),
        bulletPoints: asinData.bulletPoints,
        images: asinData.imageCount,
        keywords: asinData.keywords,
        brand: asinData.brand,
        category: asinData.category,
        rating: asinData.rating,
        reviewCount: asinData.reviewCount,
        score: 0,
        issues: [],
        suggestions: [],
      };
      setListings([listingData]);
      toast('', '', {
        title: 'ASIN Data Fetched',
        description: `Successfully fetched data for ASIN ${asin}.`,
      });
    } catch {
      setError(`Failed to fetch data for ASIN ${asin}.`);
      toast('', '', {
        title: 'ASIN Fetch Failed',
        description: `Could not retrieve data for ASIN ${asin}.`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [asin, toast, setError, setIsLoading, setListings]);

  const clearData = useCallback(() => {
    setListings([]);
    setAsin('');
    setError(undefined);
  }, []);

  const handleExport = useCallback(() => {
    if (listings.length === 0) {
      toast('', '', { title: 'No Data to Export', description: 'Please upload and process a CSV file first.' });
      return;
    }

    const exportData = listings.map((l) => ({
      Product: l.product,
      Title: l.title,
      Description: l.description,
      'Bullet Points': l.bulletPoints?.join('; '),
      Images: l.images,
      Keywords: l.keywords?.join(', '),
      Score: l.score,
      Issues: l.issues.join(', '),
      Suggestions: l.suggestions.join(', '),
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'listing_analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('', '', {
  title: 'CSV Exported',
  description: 'The listing analysis has been exported to a CSV file.',
});
  }, [listings, toast]);

  // Ensure all dependencies are properly declared for React hooks
  useEffect(() => {
    // Initial setup or cleanup if needed
    return () => {
      // Cleanup logic if needed
    };
  }, []);

  return (
    <DataCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataCard>
          <CardContent className="p-6">
            <div className="w-full">
              <Label htmlFor="upload-csv">Upload CSV File</Label>
              <Input
                id="upload-csv"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="mt-1"
              />
            </div>
          </CardContent>
        </DataCard>
        <DataCard>
          <CardContent className="p-6">
            <div className="w-full">
              <Label htmlFor="asin">Check ASIN</Label>
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <Input
                  id="asin"
                  type="text"
                  placeholder="Enter ASIN"
                  value={asin}
                  onChange={(e) => setAsin(e.target.value)}
                  disabled={isLoading}
                />
                <Button type="submit" onClick={handleAsinCheck}>
                  Check
                </Button>
              </div>
              <Card className="mt-4 bg-destructive/10 text-destructive">
                <div className="space-y-2">
                  {error && asin && (
                    <CardContent className="p-4">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      {error}
                    </CardContent>
                  )}
                </div>
              </Card>
            </div>
          </CardContent>
        </DataCard>
      </div>
      <div className="flex justify-end gap-2 mb-6">
        <Button variant="outline" onClick={handleExport} disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="destructive" onClick={clearData}>
          <X className="mr-2 h-4 w-4" />
          Clear Data
        </Button>
      </div>
      {listings.length > 0 && !isLoading && (
        <DataCard>
          <CardContent className="p-4 space-y-6">
            {listings.map((listing, index) => (
              <Card key={`${listing.product}-${index}`}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {listing.product}
                    <Badge variant={getBadgeVariant(listing.score)}>
                      {listing.score} / 100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details">
                      <AccordionTrigger>
                        <FileText className="mr-2 h-4 w-4" />
                        Details
                      </AccordionTrigger>
                      <AccordionContent className="text-sm space-y-1">
                        <div>
                          <strong>Title:</strong> {listing.title}
                        </div>
                        <div>
                          <strong>Description:</strong> {listing.description}
                        </div>
                        <div>
                          <strong>Bullet Points:</strong>
                          <ul>
                            {listing.bulletPoints?.map((bp, i) => (
                              <li key={i}>{bp}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong>Images:</strong> {listing.images}
                        </div>
                        <div>
                          <strong>Keywords:</strong>{' '}
                          {listing.keywords?.join(', ')}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="issues">
                      <AccordionTrigger>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Issues
                      </AccordionTrigger>
                      <AccordionContent>
                        {listing.issues.length > 0 ? (
                          <ul>
                            {listing.issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        ) : (
                          'No issues found.'
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="suggestions">
                      <AccordionTrigger>
                        <Info className="mr-2 h-4 w-4" />
                        Suggestions
                      </AccordionTrigger>
                      <AccordionContent>
                        {listing.suggestions.length > 0 ? (
                          <ul>
                            {listing.suggestions.map((suggestion, i) => (
                              <li key={i}>{suggestion}</li>
                            ))}
                          </ul>
                        ) : (
                          'No suggestions available.'
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </DataCard>
      )}
    </DataCard>
  );
}

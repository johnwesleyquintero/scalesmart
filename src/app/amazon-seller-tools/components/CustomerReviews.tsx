import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParsedFileData } from '@/types/amazon-tools';
// import { fetchCustomerReviews } from '@/lib/amazon-tools/sp-api'; // No longer directly imported
import { analyzeReviewWithAI } from '@/lib/amazon-tools/reviewAnalysisAI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export interface CustomerReviewData {
  reviewId: string;
  asin: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  themes?: string[];
}

interface CustomerReviewsProps {
  parsedData: ParsedFileData<CustomerReviewData>[];
}

const CustomerReviews: React.FC<CustomerReviewsProps> = ({ parsedData }) => {
  const [asinInput, setAsinInput] = useState<string>('');
  const [reviews, setReviews] = useState<CustomerReviewData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);

  const allReviews = useMemo(() => {
    const uploadedReviews = parsedData.flatMap((fileData) => fileData.data);
    return [...uploadedReviews, ...reviews];
  }, [parsedData, reviews]);

  const handleFetchReviews = async () => {
    if (!asinInput) {
      setError('Please enter an ASIN to fetch reviews.');
      return;
    }

    setLoading(true);
    setError(null);
    setReviews([]);
    setAnalysisProgress(0);

    try {
      const response = await fetch(
        `/api/amazon-tools/customer-reviews?asin=${asinInput}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const fetchedReviews: CustomerReviewData[] = await response.json();

      if (fetchedReviews) {
        // Analysis is now done on the server-side, so no need to re-analyze here
        setReviews(fetchedReviews);
        setAnalysisProgress(100); // Set to 100% as analysis is complete
      } else {
        setError(
          'Failed to fetch reviews. Please check the ASIN and try again.',
        );
      }
    } catch (err) {
      console.error('Error fetching or analyzing reviews:', err);
      setError(
        'An unexpected error occurred while fetching or analyzing reviews.',
      );
    } finally {
      setLoading(false);
    }
  };

  const sentimentSummary = useMemo(() => {
    const summary = { positive: 0, negative: 0, neutral: 0, total: 0 };
    allReviews.forEach((review) => {
      if (review.sentiment) {
        summary[review.sentiment]++;
      }
      summary.total++;
    });
    return summary;
  }, [allReviews]);

  const commonThemes = useMemo(() => {
    const themeCounts: { [key: string]: number } = {};
    allReviews.forEach((review) => {
      review.themes?.forEach((theme) => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
    });
    return Object.entries(themeCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5) // Top 5 themes
      .map(([theme]) => theme);
  }, [allReviews]);

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">
        Customer Review & Feedback Analysis
      </h2>
      <p className="text-muted-foreground dark:text-gray-400">
        Analyze customer reviews and feedback to gain insights into product
        performance and customer satisfaction.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fetch Reviews by ASIN</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="asin-input">
              Amazon Standard Identification Number (ASIN)
            </Label>
            <Input
              id="asin-input"
              placeholder="e.g., B07XXXXXXX"
              value={asinInput}
              onChange={(e) => setAsinInput(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={handleFetchReviews} disabled={loading}>
            {loading ? 'Fetching & Analyzing...' : 'Fetch & Analyze Reviews'}
          </Button>
          {loading && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Analyzing reviews...
              </p>
              <Progress value={analysisProgress} className="w-full" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* AI-Powered Analysis Summary Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>AI-Powered Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {allReviews.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Overall Sentiment:</h4>
                <p>Positive: {sentimentSummary.positive}</p>
                <p>Negative: {sentimentSummary.negative}</p>
                <p>Neutral: {sentimentSummary.neutral}</p>
                <p>Total Analyzed Reviews: {sentimentSummary.total}</p>
              </div>
              <div>
                <h4 className="font-semibold">Top Themes:</h4>
                {commonThemes.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {commonThemes.map((theme, index) => (
                      <li key={index}>{theme}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    No common themes identified yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Sentiment analysis and common themes extracted from reviews will
              be displayed here after reviews are fetched or uploaded.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Individual Reviews Section */}
      {allReviews.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">All Customer Reviews</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allReviews.map((review, index) => (
              <Card key={`review-${review.reviewId || index}`}>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{review.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p>ASIN: {review.asin}</p>
                  <p>Rating: {review.rating} / 5</p>
                  <p className="text-sm text-muted-foreground">
                    {review.body.substring(0, 150)}
                    {review.body.length > 150 ? '...' : ''}
                  </p>
                  {review.sentiment && (
                    <p>
                      Sentiment:{' '}
                      <span
                        className={
                          review.sentiment === 'positive'
                            ? 'text-green-500'
                            : review.sentiment === 'negative'
                              ? 'text-red-500'
                              : 'text-yellow-500'
                        }
                      >
                        {review.sentiment}
                      </span>
                    </p>
                  )}
                  {review.themes && review.themes.length > 0 && (
                    <p>Themes: {review.themes.join(', ')}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Date: {review.date}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 p-4 border rounded-md text-center text-muted-foreground dark:text-gray-400">
          Upload customer review data via the Data Source tab or fetch by ASIN
          to view details and analysis.
        </div>
      )}
    </div>
  );
};

export default CustomerReviews;

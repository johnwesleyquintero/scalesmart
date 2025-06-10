import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card'; // Removed unused imports
import { Textarea } from '@/components/ui/textarea';

interface ParsedFileData {
  fileName: string;
  data: Record<string, unknown>[];
}

interface ListingOptimizationProps {
  parsedData: ParsedFileData[];
}

const ListingOptimization: React.FC<ListingOptimizationProps> = ({
  parsedData,
}) => {
  const [listingTitle, setListingTitle] = useState('');
  const [bulletPoints, setBulletPoints] = useState('');
  const [description, setDescription] = useState('');
  const [optimizationResults, setOptimizationResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const handleOptimizeListing = useCallback(async () => {
    setIsLoading(true);
    setOptimizationResults([]); // Clear previous results

    console.log('Optimizing listing:', {
      listingTitle,
      bulletPoints,
      description,
    });
    console.log('Available parsed data:', parsedData);

    // Simulate an asynchronous optimization process
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call delay

    // In a real application, you would call an API or perform logic here
    // Based on inputs and parsedData
    const simulatedSuggestions = [
      'Suggestion 1: Include relevant keywords from parsed data in the title.',
      'Suggestion 2: Use strong action verbs in bullet points.',
      'Suggestion 3: Write a compelling product description highlighting benefits.',
      'Suggestion 4: Consider competitor analysis from parsed data if available.',
    ];

    setOptimizationResults(simulatedSuggestions);
    setIsLoading(false);
  }, [listingTitle, bulletPoints, description, parsedData]); // Include dependencies

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      {' '}
      {/* Added max-width and auto margin for centering */}
      <div>
        {' '}
        {/* Grouping title and description */}
        <h2 className="text-3xl font-bold">Listing Optimization</h2>{' '}
        {/* Slightly larger title */}
        <p className="text-muted-foreground dark:text-gray-400 mt-1">
          Get suggestions to optimize your Amazon product listings based on
          provided data.
        </p>
      </div>
      <div className="space-y-4">
        {' '}
        {/* Form section */}
        <div className="grid gap-2">
          {' '}
          {/* Adjusted gap */}
          <Label htmlFor="listing-title">Listing Title</Label>
          <Input
            id="listing-title"
            type="text"
            placeholder="Enter listing title (e.g., 'Premium Ergonomic Office Chair')"
            value={listingTitle}
            onChange={(e) => setListingTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bullet-points">Bullet Points (one per line)</Label>
          <Textarea
            id="bullet-points"
            placeholder="Enter bullet points, one per line (e.g., '* Easy Assembly\n* Breathable Mesh Back')"
            value={bulletPoints}
            onChange={(e) => setBulletPoints(e.target.value)}
            rows={5} // Added rows for better usability
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Product Description</Label>
          <Textarea
            id="description"
            placeholder="Enter product description (e.g., 'Our chair offers exceptional comfort and support...')"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={7} // Added rows
          />
        </div>
        <Button onClick={handleOptimizeListing} disabled={isLoading}>
          {' '}
          {/* Disable button when loading */}
          {isLoading ? 'Optimizing...' : 'Optimize Listing'}{' '}
          {/* Button text reflects loading state */}
        </Button>
      </div>
      {optimizationResults.length > 0 && (
        <div className="space-y-4">
          {' '}
          {/* Results section */}
          <h3 className="text-2xl font-semibold">
            Optimization Suggestions
          </h3>{' '}
          {/* Adjusted heading size */}
          <div className="space-y-3">
            {' '}
            {/* Adjusted gap */}
            {optimizationResults.map((suggestion, index) => (
              <Card key={index}>
                {' '}
                {/* Using index as key since suggestions are simple strings */}
                <CardContent className="p-4 text-sm text-muted-foreground dark:text-gray-400">
                  {' '}
                  {/* Combined classes */}
                  {suggestion}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingOptimization;

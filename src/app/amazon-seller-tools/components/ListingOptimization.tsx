import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardHeader and CardTitle
import { Textarea } from '@/components/ui/textarea';
import { ListingOptimizationData, ParsedFileData } from '@/types/amazon-tools'; // Import ParsedFileData

interface ListingOptimizationProps {
  parsedData: ParsedFileData<ListingOptimizationData>[];
}

const ListingOptimization: React.FC<ListingOptimizationProps> = ({
  parsedData,
}) => {
  const [listingTitle, setListingTitle] = useState('');
  const [bulletPoints, setBulletPoints] = useState('');
  const [description, setDescription] = useState('');
  const [backendKeywords, setBackendKeywords] = useState(''); // Added state for backend keywords
  const [subjectMatter, setSubjectMatter] = useState(''); // Added state for subject matter
  const [optimizationResults, setOptimizationResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const handleOptimizeListing = useCallback(async () => {
    setIsLoading(true);
    setOptimizationResults([]); // Clear previous results

    const suggestions: string[] = [];
    const inputKeywords = listingTitle.toLowerCase().split(' ').filter(Boolean);
    const inputBulletPoints = bulletPoints.split(/[\n\r]+/).map(point => point.trim()).filter(Boolean);
    const inputDescription = description.toLowerCase();
    const inputBackendKeywords = backendKeywords.toLowerCase().split(',').map(kw => kw.trim()).filter(Boolean);
    const inputSubjectMatter = subjectMatter.toLowerCase().split(',').map(sm => sm.trim()).filter(Boolean);


    // Suggestions based on parsed data
    parsedData.forEach((file) => {
      file.data.forEach((listing) => {
        const parsedTitle = listing.title?.toLowerCase() || '';
        const parsedBulletPoints = listing.bulletPoints?.map(point => point.toLowerCase()) || [];
        const parsedDescription = listing.description?.toLowerCase() || '';
        const parsedBackendKeywords = listing.backendKeywords?.toLowerCase().split(',').map(kw => kw.trim()).filter(Boolean) || [];
        const parsedSubjectMatter = listing.subjectMatter?.toLowerCase().split(',').map(sm => sm.trim()).filter(Boolean) || [];


        // Suggest keywords from parsed data that are not in the input title
        parsedTitle.split(' ').filter(Boolean).forEach(keyword => {
          if (!inputKeywords.includes(keyword)) {
             suggestions.push(`Consider adding "${keyword}" to your title based on other listings.`);
          }
        });

        // Suggest keywords from parsed data bullet points not in input bullet points
         parsedBulletPoints.forEach(point => {
           point.split(' ').filter(Boolean).forEach(keyword => {
             if (!inputBulletPoints.some(bp => bp.toLowerCase().includes(keyword))) {
               suggestions.push(`Consider incorporating "${keyword}" into your bullet points.`);
             }
           });
         });

        // Suggest keywords from parsed data description not in input description
         parsedDescription.split(' ').filter(Boolean).forEach(keyword => {
           if (!inputDescription.includes(keyword)) {
             suggestions.push(`Consider using "${keyword}" in your product description.`);
           }
         });

        // Suggest backend keywords from parsed data not in input backend keywords
         parsedBackendKeywords.forEach(keyword => {
           if (!inputBackendKeywords.includes(keyword)) {
             suggestions.push(`Consider adding "${keyword}" to your backend keywords.`);
           }
         });

        // Suggest subject matter from parsed data not in input subject matter
         parsedSubjectMatter.forEach(keyword => {
           if (!inputSubjectMatter.includes(keyword)) {
             suggestions.push(`Consider adding "${keyword}" to your subject matter.`);
           }
         });

      });
    });

    // Add some generic suggestions
    if (listingTitle.length < 50 || listingTitle.length > 200) {
      suggestions.push('Suggestion: Optimize your title length (aim for 50-200 characters).');
    }
    if (inputBulletPoints.length < 5) {
       suggestions.push('Suggestion: Aim for at least 5 bullet points to highlight key features.');
    }
    if (description.length < 200) {
       suggestions.push('Suggestion: Expand your product description to provide more details and benefits.');
    }
    if (backendKeywords.split(',').filter(Boolean).length < 10) {
        suggestions.push('Suggestion: Utilize more backend keywords to improve search visibility.');
    }


    // Remove duplicate suggestions
    const uniqueSuggestions = Array.from(new Set(suggestions));

    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing delay

    setOptimizationResults(uniqueSuggestions);
    setIsLoading(false);
  }, [listingTitle, bulletPoints, description, backendKeywords, subjectMatter, parsedData]); // Added new states to dependencies

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
         <div className="grid gap-2"> {/* Added input for backend keywords */}
          <Label htmlFor="backend-keywords">Backend Keywords (comma-separated)</Label>
          <Input
            id="backend-keywords"
            type="text"
            placeholder="Enter backend keywords (e.g., 'ergonomic, office, chair')"
            value={backendKeywords}
            onChange={(e) => setBackendKeywords(e.target.value)}
          />
        </div>
         <div className="grid gap-2"> {/* Added input for subject matter */}
          <Label htmlFor="subject-matter">Subject Matter (comma-separated)</Label>
          <Input
            id="subject-matter"
            type="text"
            placeholder="Enter subject matter (e.g., 'furniture, office supplies')"
            value={subjectMatter}
            onChange={(e) => setSubjectMatter(e.target.value)}
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

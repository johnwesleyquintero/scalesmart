import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductResearchData } from '@/types/amazon-tools';

interface ProductSearchResult extends ProductResearchData {
  id: number; // Add an ID for keying in lists
}

interface ParsedFileData<T> {
  fileName: string;
  data: T[];
}

interface ProductResearchProps {
  parsedData: ParsedFileData<ProductResearchData>[];
}

const ProductResearch: React.FC<ProductResearchProps> = ({ parsedData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);

  const handleSearch = () => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filteredResults: ProductSearchResult[] = [];

    parsedData.forEach((file) => {
      file.data.forEach((product, index) => {
        if (
          product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          product.asin.toLowerCase().includes(lowerCaseSearchTerm)
        ) {
          filteredResults.push({ ...product, id: filteredResults.length + 1 });
        }
      });
    });
    setSearchResults(filteredResults);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Product Research</h2>
      <p className="text-muted-foreground dark:text-gray-400">
        Search for products on Amazon to analyze their potential.
      </p>

      <div className="flex items-center gap-2">
        <div className="grid flex-grow gap-1.5">
          <Label htmlFor="product-search">Product Keyword or ASIN</Label>
          <Input
            id="product-search"
            type="text"
            placeholder="Enter keyword or ASIN"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
        </div>
        <Button onClick={handleSearch} className="self-end">
          Search
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Search Results</h3>
          {searchResults.map((result) => (
            <Card key={result.id}>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{result.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Price: ${result.price.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  ASIN: {result.asin}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchTerm && searchResults.length === 0 && (
        <p className="text-muted-foreground dark:text-gray-400 italic text-center">
          No products found matching "{searchTerm}".
        </p>
      )}
    </div>
  );
};

export default ProductResearch;

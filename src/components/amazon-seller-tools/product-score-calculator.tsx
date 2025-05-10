/* eslint-disable sonarjs/no-dead-store */
/* eslint-disable sonarjs/no-unused-vars */
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  calculateProductScore,
  type ProductScore,
} from '@/lib/amazon-tools/scoring-utils';
import { type ProductListingData } from '@/lib/amazon-types';
// Import ChangeEvent for explicit typing
import { useState, type ChangeEvent } from 'react';

const initialFormData: ProductListingData = {
  asin: '',
  title: '',
  bulletPoints: [''],
  description: '',
  imageCount: 0,
  rating: 0,
  reviewCount: 0,
  hasAPlusContent: false,
  fulfillmentType: 'FBM',
};

export default function ProductScoreCalculator() {
  const [formData, setFormData] = useState<ProductListingData>(initialFormData);
  const [score, setScore] = useState<ProductScore | undefined>(undefined);

  // Explicitly type the event as ChangeEvent<HTMLInputElement>
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData({
      ...formData,
      [id]: type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  // Explicitly type the event as ChangeEvent<HTMLTextAreaElement>
  const handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleBulletPointChange = (index: number, value: string) => {
    const newBulletPoints = [...formData.bulletPoints];
    newBulletPoints[index] = value;
    setFormData({ ...formData, bulletPoints: newBulletPoints });
  };

  const addBulletPoint = () => {
    if (formData.bulletPoints.length < 5) {
      setFormData({
        ...formData,
        bulletPoints: [...formData.bulletPoints, ''],
      });
    }
  };

  const removeBulletPoint = (index: number) => {
    const newBulletPoints = formData.bulletPoints.filter((_, i) => i !== index);
    setFormData({ ...formData, bulletPoints: newBulletPoints });
  };

  const calculateScoreHandler = () => {
    // Renamed to avoid conflict with imported function
    const result = calculateProductScore(formData);
    setScore(result);
  };

  const getScoreColor = (scoreValue: number): string => {
    // Renamed parameter to avoid conflict
    if (scoreValue >= 8) return 'bg-green-500';
    if (scoreValue >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Score Calculator</CardTitle>
          <CardDescription>
            Calculate a quality score for your Amazon product listing based on
            various optimization factors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Product Title</Label>
            <Input
              id="title"
              value={formData.title}
              // Use the specific handler or cast e.target
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter your product title"
            />
          </div>

          <div className="space-y-2">
            <Label>Bullet Points</Label>
            {formData.bulletPoints.map((bullet, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={bullet}
                  // Use the specific handler or cast e.target
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleBulletPointChange(index, e.target.value)
                  }
                  placeholder={`Bullet point ${index + 1}`}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeBulletPoint(index)}
                  disabled={formData.bulletPoints.length === 1}
                >
                  × {/* Using multiplication sign for better visual */}
                </Button>
              </div>
            ))}
            {formData.bulletPoints.length < 5 && (
              <Button variant="outline" onClick={addBulletPoint}>
                Add Bullet Point
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Product Description</Label>
            {/* Use standard textarea and apply styles */}
            <textarea
              id="description"
              className="w-full min-h-[100px] p-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" // Apply similar styling as Input
              value={formData.description}
              // Use the specific handler or cast e.target
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter your product description (HTML formatting allowed)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imageCount">Number of Images</Label>
              <Input
                id="imageCount"
                type="number"
                min="0"
                // max="9" // The Input component might not support 'max' directly, handle validation elsewhere if needed
                value={formData.imageCount}
                // Use the specific handler or cast e.target
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    imageCount: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Average Rating</Label>
              <Input
                id="rating"
                type="number"
                min="0"
                // max="5" // The Input component might not support 'max' directly
                step="0.1"
                value={formData.rating}
                // Use the specific handler or cast e.target
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    rating: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewCount">Number of Reviews</Label>
            <Input
              id="reviewCount"
              type="number"
              min="0"
              value={formData.reviewCount}
              // Use the specific handler or cast e.target
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({
                  ...formData,
                  reviewCount: parseInt(e.target.value, 10) || 0,
                })
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="aplus"
              checked={formData.hasAPlusContent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, hasAPlusContent: checked })
              }
            />
            <Label htmlFor="aplus">Has A+ Content</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fulfillment">Fulfillment Type</Label>
            <Select
              value={formData.fulfillmentType}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  fulfillmentType: value as 'FBA' | 'FBM',
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fulfillment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FBA">Fulfilled by Amazon (FBA)</SelectItem>
                <SelectItem value="FBM">Fulfilled by Merchant (FBM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" onClick={calculateScoreHandler}>
            {' '}
            {/* Use renamed handler */}
            Calculate Score
          </Button>
        </CardContent>
      </Card>

      {score && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Overall Score
              <Badge className={getScoreColor(score.overall)}>
                {score.overall}/10
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {' '}
              {/* Added w-full */}
              <AccordionItem value="breakdown">
                <AccordionTrigger>Score Breakdown</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {Object.entries(score.breakdown).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center"
                      >
                        {/* Simple capitalization */}
                        <span className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <Badge className={getScoreColor(value)}>
                          {value}/10
                        </Badge>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="suggestions">
                <AccordionTrigger>Improvement Suggestions</AccordionTrigger>
                <AccordionContent>
                  {score.suggestions.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                      {' '}
                      {/* Added text-sm */}
                      {score.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No specific suggestions.
                    </p> // Added fallback message
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

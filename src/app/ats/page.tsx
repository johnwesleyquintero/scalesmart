'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Check, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { MDXRemote } from 'next-mdx-remote';
// Ensure components is correctly imported and structured for MDX rendering
import { components as mdxComponents } from '@/components/MdxRenderer';
import { useMutation } from '@tanstack/react-query';

// Define constants for validation rules and API endpoint
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5MB
const API_ANALYZE_ENDPOINT = '/api/resume/analyze';

interface ResumeAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywords: {
    present: string[];
    missing: string[];
  };
  sections: {
    present: string[];
    missing: string[];
  };
}

/**
 * Validates a selected file against predefined types and size limits.
 * Uses constants for allowed types and size, improving maintainability.
 *
 * @param file The file object to validate.
 * @returns An object indicating whether the file is valid and a message.
 */
const validateFile = (file: File): { isValid: boolean; message: string } => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      message: `Only ${ALLOWED_FILE_TYPES.map((type) => type.split('/').pop()?.toUpperCase()).join(', ')} files are allowed.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      message: `File size must not exceed ${MAX_FILE_SIZE_MB}MB.`,
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Sends the file to the backend API for analysis.
 * Uses FormData for file upload and handles potential HTTP errors.
 *
 * @param file The file to upload.
 * @returns A promise resolving to the ResumeAnalysis data.
 * @throws An error if the HTTP response is not OK.
 */
const analyzeResumeFn = async (file: File): Promise<ResumeAnalysis> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(API_ANALYZE_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    // Attempt to read error message from response body if available, otherwise use status text
    const errorText = await response
      .text()
      .catch(() => `HTTP error! status: ${response.status}`);
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default function ResumeScanner() {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    mutate: analyzeResume,
    data: analysis,
    isPending: isAnalyzing,
    isError,
    error,
    reset: resetMutation,
  } = useMutation<ResumeAnalysis, Error, File>({
    mutationFn: analyzeResumeFn,
    // onSuccess: (data) => { /* Optional: handle success state updates or side effects here */ },
    onError: (err: Error) => {
      console.error('Error analyzing resume:', err);
      toast({
        title: 'Analysis Failed',
        description:
          err.message || 'An unexpected error occurred during resume analysis.',
        variant: 'destructive',
      });
    },
  });

  const handleAnalyzeClick = () => {
    if (file && !isAnalyzing) {
      analyzeResume(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    // If no file is selected (e.g., cancelled file picker)
    if (!selectedFile) {
      setFile(null);
      resetMutation(); // Reset previous analysis state
      if (fileInputRef.current) {
        // Clear the input value so selecting the same file again triggers change
        fileInputRef.current.value = '';
      }
      return;
    }

    const validationResult = validateFile(selectedFile);
    if (!validationResult.isValid) {
      toast({
        title: 'Invalid File',
        description: validationResult.message,
        variant: 'destructive',
      });
      // Clear the input value so selecting the same file again triggers change
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null); // Clear the selected file state
      resetMutation(); // Reset previous analysis state
      return;
    }

    // File is valid
    setFile(selectedFile);
    // Reset previous analysis when a new valid file is selected
    resetMutation();
  };

  const resetScanner = () => {
    setFile(null);
    resetMutation(); // Reset mutation state to clear analysis data and errors
    if (fileInputRef.current) {
      // Clear the input value so selecting the same file again triggers change
      fileInputRef.current.value = '';
    }
  };

  // Determines the background and text color class based on the score
  const getScoreColorClass = (score: number): string => {
    if (score >= 80) return 'bg-success text-success-foreground';
    if (score >= 60) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  // Memoize the MDX source creation to avoid recreating it on every render
  const suggestionsMdxSource = useMemo(() => {
    if (analysis && analysis.suggestions.length > 0) {
      // Format suggestions as a markdown list
      const markdown = analysis.suggestions.map((s) => `- ${s}`).join('\n');
      return {
        compiledSource: markdown,
        scope: {}, // Provide empty scope if no variables are needed in MDX
        frontmatter: {}, // Provide empty frontmatter if not used
      };
    }
    return null; // Return null if no suggestions
  }, [analysis]); // Depend only on the analysis data

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-background">
      <h1 className="text-3xl font-bold my-6 text-center">
        Resume Scanner & ATS Optimizer
      </h1>
      <p className="text-lg text-muted-foreground text-center mb-8">
        Analyze your resume for ATS compatibility and get suggestions for
        improvement.
      </p>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resume Scanner</CardTitle>
          <CardDescription>
            Upload your resume to analyze against industry standards and
            optimize for ATS systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            {!file ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Upload your resume (PDF or DOCX)
                </p>
                {/* Hidden file input triggered by button click */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-success" />
                  <span className="font-medium">{file.name}</span>
                  {/* Button to clear the selected file and reset */}
                  <Button variant="ghost" size="icon" onClick={resetScanner}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {/* Button to trigger analysis mutation */}
                <Button onClick={handleAnalyzeClick} disabled={isAnalyzing}>
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading state indicator */}
      {isAnalyzing && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              {/* Static progress value as a simple loading bar */}
              <Progress className="w-full" value={30} />
              <p className="text-muted-foreground">
                Analyzing your resume... This may take a few seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state display */}
      {isError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          {/* Display specific error message if available */}
          <p>
            An error occurred during analysis:{' '}
            {error?.message || 'Unknown error'}. Please try again.
          </p>
        </Alert>
      )}

      {/* Display analysis results */}
      {analysis && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Resume Score</CardTitle>
                {/* Score display with dynamic background/text color */}
                <div
                  className={`px-3 py-1 rounded-full ${getScoreColorClass(analysis.score)} text-sm font-medium`}
                >
                  {analysis.score}/100
                </div>
              </div>
              <CardDescription>
                How your resume compares to top candidates in your industry
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Progress bar showing the score */}
              <Progress value={analysis.score} className="h-3" />
              {/* Score details */}
              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">ATS Score</div>
                  <div
                    className={`${analysis.score >= 70 ? 'text-success' : 'text-warning'} font-bold`}
                  >
                    {analysis.score >= 70 ? 'Good' : 'Needs Work'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Keywords Match</div>
                  <div className="text-muted-foreground">
                    {analysis.keywords.present.length}/
                    {analysis.keywords.present.length +
                      analysis.keywords.missing.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Sections</div>
                  <div className="text-muted-foreground">
                    {analysis.sections.present.length}/
                    {analysis.sections.present.length +
                      analysis.sections.missing.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.strengths.map((strength, index) => (
                    // Using index as key as unique IDs are not available in the data structure.
                    // Prefer unique IDs if possible for better list rendering performance
                    // with reordering/filtering.
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.weaknesses.map((weakness, index) => (
                    // Using index as key as unique IDs are not available in the data structure.
                    // Prefer unique IDs if possible.
                    <li key={index} className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-warning mr-2 mt-0.5 flex-shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          {/* Display suggestions rendered via MDXRemote */}
          {suggestionsMdxSource && (
            <Card>
              <CardHeader>
                <CardTitle>Optimization Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Pass memoized source and components to MDXRemote */}
                <MDXRemote
                  {...suggestionsMdxSource}
                  components={mdxComponents}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

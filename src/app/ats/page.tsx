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
import { components as components } from '@/components/MdxRenderer';
import { useMutation } from '@tanstack/react-query'; // Import useMutation

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
 * This function improves code clarity by centralizing file validation,
 * making the `handleFileChange` function more concise and readable.
 * It promotes scalability by providing a single point for updating file
 * validation rules, ensuring consistency across the application if other
 * file uploads were introduced.
 *
 * @param file The file object to validate.
 * @returns An object indicating whether the file is valid and a message.
 */
const validateFile = (file: File): { isValid: boolean; message: string } => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      message: 'Only PDF, DOC, or DOCX files are allowed.',
    };
  }

  if (file.size > maxSize) {
    return { isValid: false, message: 'File size must not exceed 5MB.' };
  }

  return { isValid: true, message: '' };
};

// Async function to analyze resume
const analyzeResumeFn = async (file: File): Promise<ResumeAnalysis> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/resume/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
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
    isPending: isAnalyzing, // Renamed isLoading to isPending for consistency with @tanstack/react-query v5
    isError,
    error,
    reset: resetMutation,
  } = useMutation<ResumeAnalysis, Error, File>({
    mutationFn: analyzeResumeFn,
    onSuccess: () => {
      // Any additional success handling if needed
    },
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
    if (file) {
      analyzeResume(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      resetMutation(); // Reset mutation state as well
      return;
    }

    const validationResult = validateFile(selectedFile);
    if (!validationResult.isValid) {
      toast({
        title: 'Invalid File',
        description: validationResult.message,
        variant: 'destructive',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the input
      }
      setFile(null);
      resetMutation(); // Reset mutation state as well
      return;
    }

    setFile(selectedFile);
    resetMutation(); // Reset previous analysis when a new file is selected
  };

  const resetScanner = () => {
    setFile(null);
    resetMutation(); // Reset mutation state to clear analysis data and errors
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success text-success-foreground';
    if (score >= 60) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const suggestionsMdxSource = useMemo(() => {
    if (analysis && analysis.suggestions.length > 0) {
      return {
        compiledSource: analysis.suggestions.map((s) => `- ${s}`).join('\n'),
        scope: {}, // Provide empty scope
        frontmatter: {}, // Provide empty frontmatter
      };
    }
    return null;
  }, [analysis]);
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
                  {file ? 'Change File' : 'Select File'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-success" />
                  <span className="font-medium">{file.name}</span>
                  <Button variant="ghost" size="icon" onClick={resetScanner}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleAnalyzeClick} disabled={isAnalyzing}>
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isAnalyzing && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Progress className="w-full" value={30} />
              <p className="text-muted-foreground">
                Analyzing your resume... This may take a few seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <p>
            An error occurred during analysis:{' '}
            {error?.message || 'Unknown error'}. Please try again.
          </p>
        </Alert>
      )}

      {analysis && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Resume Score</CardTitle>
                <div
                  className={`px-3 py-1 rounded-full ${getScoreColor(analysis.score)} text-sm font-medium`}
                >
                  {analysis.score}/100
                </div>
              </div>
              <CardDescription>
                How your resume compares to top candidates in your industry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={analysis.score} className="h-3" />
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
                  <div className="text-gray-600 dark:text-gray-300">
                    {analysis.keywords.present.length}/
                    {analysis.keywords.present.length +
                      analysis.keywords.missing.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Sections</div>
                  <div className="text-gray-600 dark:text-gray-300">
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
                    <li key={index} className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-warning mr-2 mt-0.5 flex-shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          {suggestionsMdxSource && (
            <Card>
              <CardHeader>
                <CardTitle>Optimization Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <MDXRemote {...suggestionsMdxSource} components={components} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

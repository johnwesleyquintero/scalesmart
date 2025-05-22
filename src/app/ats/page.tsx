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
import { useRef, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import MdxRenderer from '@/components/MdxRenderer';

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

export default function ResumeScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze resume function (placeholder for API call)
  const analyzeResume = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysis(null); // Clear previous analysis

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ResumeAnalysis = await response.json();
      setAnalysis(data);
    } catch (error: unknown) {
      console.error('Error analyzing resume:', error);
      // Provide user feedback on the error
      setAnalysis({
        score: 0,
        strengths: [],
        weaknesses: ['An error occurred during analysis. Please try again.'],
        suggestions: [],
        keywords: { present: [], missing: [] },
        sections: { present: [], missing: [] },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setFile(null);
      setAnalysis(null);
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a PDF, DOC, or DOCX file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the input
      }
      setFile(null);
      setAnalysis(null);
      return;
    }

    if (file.size > maxSize) {
      alert('File size exceeds the limit (5MB).');
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the input
      }
      setFile(null);
      setAnalysis(null);
      return;
    }

    setFile(file);
    setAnalysis(null); // Reset previous analysis
  };

  const resetScanner = () => {
    setFile(null);
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
                <Upload className="h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-500">
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
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{file.name}</span>
                  <Button variant="ghost" size="icon" onClick={resetScanner}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={analyzeResume} disabled={isAnalyzing}>
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
              <p className="text-gray-600">
                Analyzing your resume... This may take a few seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {analysis && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Resume Score</CardTitle>
                <div
                  className={`px-3 py-1 rounded-full ${getScoreColor(analysis.score)} text-white text-sm font-medium`}
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
                    className={`${analysis.score >= 70 ? 'text-green-500' : 'text-yellow-500'} font-bold`}
                  >
                    {analysis.score >= 70 ? 'Good' : 'Needs Work'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Keywords Match</div>
                  <div className="text-gray-600">
                    {analysis.keywords.present.length}/
                    {analysis.keywords.present.length +
                      analysis.keywords.missing.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Sections</div>
                  <div className="text-gray-600">
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
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
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
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          {analysis && analysis.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Optimization Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <MdxRenderer
                  content={analysis.suggestions.join('\n')}
                  keywords={analysis.keywords.missing}
                />
              </CardContent>
            </Card>
          )}
          {analysis?.weaknesses.length && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <p>
                There was an issue analyzing your resume. Please check the
                weaknesses section for details.
              </p>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}

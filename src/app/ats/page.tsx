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
import { AlertCircle, Check, Plus, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

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

  // Mock analysis function (in a real app, this would call an API)
  const analyzeResume = () => {
    if (!file) return;

    setIsAnalyzing(true);

    // Simulate API call delay
    setTimeout(() => {
      // Mock analysis results based on common resume standards
      setAnalysis({
        score: 78,
        strengths: [
          'Clear work history with measurable achievements',
          'Good use of action verbs',
          'Appropriate length (1-2 pages)',
        ],
        weaknesses: [
          'Missing quantifiable results in 3 positions',
          'Skills section could be more tailored to target jobs',
          'No certifications listed',
        ],
        suggestions: [
          "Add more metrics to quantify your impact (e.g., 'Increased sales by 30%')",
          'Include relevant certifications for your industry',
          'Tailor skills to match job descriptions more closely',
        ],
        keywords: {
          present: [
            'leadership',
            'project management',
            'JavaScript',
            'team collaboration',
          ],
          missing: [
            'TypeScript',
            'Agile methodologies',
            'CI/CD',
            'cloud computing',
          ],
        },
        sections: {
          present: ['Experience', 'Education', 'Skills'],
          missing: ['Certifications', 'Projects', 'Volunteer Work'],
        },
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setAnalysis(null); // Reset previous analysis
    }
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
                  Select File
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
              <div className="animate-pulse">
                <svg
                  className="animate-spin h-10 w-10 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <p className="text-gray-600">
                Scanning your resume against industry standards...
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

          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-blue-100 p-1 rounded-full mr-3">
                      <Plus className="h-4 w-4 text-blue-600" />
                    </div>
                    <p>{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Keywords Found</CardTitle>
                <CardDescription>
                  {analysis.keywords.present.length} industry-relevant keywords
                  detected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.present.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Keywords</CardTitle>
                <CardDescription>
                  {analysis.keywords.missing.length} keywords to consider adding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.missing.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

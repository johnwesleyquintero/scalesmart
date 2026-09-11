import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  FileText,
  HelpCircle,
  ChevronRight,
  Trophy,
  Target,
  BarChart3,
  Video,
} from 'lucide-react';

import {
  getCertificationBySlug,
  getAllCertifications,
} from '@/data/academy/certifications-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const certification = await getCertificationBySlug(slug);

  if (!certification) {
    return {
      title: 'Certification Not Found | ScaleSmart Academy',
      description: 'The requested certification could not be found.',
    };
  }

  return {
    title: `${certification.title} | ScaleSmart Academy`,
    description: certification.description,
  };
}

export async function generateStaticParams() {
  const certifications = await getAllCertifications();
  return certifications.map((cert) => ({
    slug: cert.slug,
  }));
}

// Practice Assessment Questions for Introduction to Amazon Ads Certification
const practiceAssessmentQuestions = [
  {
    id: 1,
    question:
      'What is the main focus of purchase or conversion advertising goals?',
    options: [
      'Driving sales',
      'Building brand awareness',
      'Engaging existing customers',
    ],
    correctAnswer: 0,
  },
  {
    id: 2,
    question:
      '______ is a device where customers can browse, buy, download, and read e-books, newspapers, and magazines.',
    options: ['Amazon Kindle', 'Alexa', 'Fire TV'],
    correctAnswer: 0,
  },
  {
    id: 3,
    question:
      'Jane has written three best seller books and recently launched a campaign for her next book using Sponsored Products. What type of advertiser is Jane considered?',
    options: ['Small and medium-sized business', 'Enterprise', 'Partner'],
    correctAnswer: 0,
  },
  {
    id: 4,
    question:
      'Which of the following solutions provides a report featuring annual and quarterly views of audience sizing across the customer journey?',
    options: [
      'Audience planning tool',
      'Brand Innovation Lab',
      'Overlapping audiences',
    ],
    correctAnswer: 0,
  },
  {
    id: 5,
    question:
      "Which custom audience tool can be used to create new audiences using traffic from the advertisers' website?",
    options: [
      'Amazon Ad tag',
      'Advertiser hashed audiences',
      'Conversions API transfer',
    ],
    correctAnswer: 0,
  },
  {
    id: 6,
    question:
      'Li wishes to drive consideration amongst shoppers who have recently browsed for products in the air sports category. Which audience type would best help Li achieve this goal?',
    options: [
      'In-market audience',
      'Lifestyle audience',
      'Demographic audience',
    ],
    correctAnswer: 0,
  },
  {
    id: 7,
    question:
      'Which of the following is a pre-built, standard audience type available with Amazon Ads?',
    options: [
      'Demographic audiences',
      'Advertiser hashed audiences',
      'Lookalike audiences',
    ],
    correctAnswer: 0,
  },
  {
    id: 8,
    question:
      'Mateo sells sports equipment on Amazon.com and would like to create a series of customized videos as a part of his brand awareness campaign. Which creative self-service tool can he use to create these videos?',
    options: [
      'Amazon Creative Video Builder',
      'Streaming TV Studio',
      'Responsive eCommerce creatives',
    ],
    correctAnswer: 0,
  },
  {
    id: 9,
    question:
      'Accent Athletics a global sports company, would like to promote a new launch of sports equipment products in their Amazon Brand Store. Which of the following ad types will help them to achieve this?',
    options: ['Sponsored Products', 'Sponsored Display', 'Sponsored TV'],
    correctAnswer: 0,
  },
  {
    id: 10,
    question:
      '____ is an available Amazon Ads media channel that allows advertisers to deliver video and display ads through its gaming and live streaming service.',
    options: ['Twitch', 'Amazon Music', 'Prime Video'],
    correctAnswer: 0,
  },
  {
    id: 11,
    question:
      'Which self-service Amazon Ads tool allows advertisers to create and manage video ads, device ads, and audio ads?',
    options: ['Amazon DSP', 'Seller Central', 'Amazon advertising console'],
    correctAnswer: 0,
  },
  {
    id: 12,
    question:
      'Which of the following is an example of an industry standard success metric available when using Amazon Ads?',
    options: ['Return on ad spend', 'Advertising cost of sale', 'New-to-brand'],
    correctAnswer: 0,
  },
  {
    id: 13,
    question:
      'Accent Athletics wants a measurement solution that quantifies key shopping engagements at each stage of the shopping journey. Which of the following measurement solutions can they use to achieve this?',
    options: ['Brand Metrics', 'Amazon Marketing Cloud', 'Amazon Brand Lift'],
    correctAnswer: 0,
  },
  {
    id: 14,
    question:
      'Accent Athletics would like to measure the impact of ad tactics on shopping activities across retail outlets, while campaigns are still mid-flight. Which of the following measurement solutions can they use to achieve this?',
    options: ['Omnichannel Metrics', 'Amazon Attribution', 'Amazon Brand Lift'],
    correctAnswer: 0,
  },
  {
    id: 15,
    question:
      'The add-to-cart metric provides insight into which stage of the customer marketing journey?',
    options: ['Conversion', 'Loyalty', 'Awareness'],
    correctAnswer: 0,
  },
];

// Course modules data
interface CourseModule {
  id: string;
  title: string;
  type: 'video' | 'course';
  duration: string;
  videoUrl?: string;
  content?: string;
  completed: boolean;
}

const courseModules: CourseModule[] = [
  {
    id: 'welcome',
    title: 'Welcome to Amazon Ads',
    type: 'video',
    duration: '2m',
    videoUrl:
      'https://d1apxakas9uxdu.cloudfront.net/uploads/86007/files/2d22f226-3253-4cbc-9685-b4141fa39ead-foundations-c1-intro-v05.mp4',
    completed: false,
  },
  {
    id: 'getting-started',
    title: 'Getting started with Amazon Ads',
    type: 'course',
    duration: '8m',
    content: `## Getting Started with Amazon Ads

This module covers the fundamentals of setting up your Amazon Ads account and understanding the platform.

### Key Topics:
- Creating your advertising account
- Understanding the console interface
- Setting up billing and payment methods
- Navigating campaign manager

### Learning Objectives:
By the end of this module, you will be able to:
1. Access and navigate the Amazon Ads console
2. Set up your account properly
3. Understand the basic structure of campaigns
`,
    completed: false,
  },
  {
    id: 'strategy',
    title: 'Plan your Amazon Ads strategy',
    type: 'course',
    duration: '14m',
    content: `## Plan Your Amazon Ads Strategy

Learn how to develop a comprehensive advertising strategy that aligns with your business goals.

### Key Topics:
- Defining advertising objectives
- Understanding the customer journey
- Selecting the right ad formats
- Budget allocation strategies

### Strategic Framework:
1. **Awareness**: Reach new customers
2. **Consideration**: Engage interested shoppers
3. **Conversion**: Drive purchases
4. **Loyalty**: Retain and grow customer value
`,
    completed: false,
  },
  {
    id: 'ad-formats',
    title: 'Reach customers with ad formats and channels',
    type: 'course',
    duration: '13m',
    content: `## Reach Customers with Ad Formats and Channels

Explore the full range of Amazon Ads formats and placement opportunities.

### Ad Types Covered:
- **Sponsored Products**: Product-level targeting
- **Sponsored Brands**: Brand-level visibility
- **Sponsored Display**: Audience-based retargeting
- **Sponsored TV**: Streaming video advertising

### Channel Overview:
- Amazon owned & operated sites
- Third-party publisher network
- Streaming services (Prime Video, Twitch)
- Devices (Fire TV, Kindle, Alexa)
`,
    completed: false,
  },
  {
    id: 'measurement',
    title: 'Report and measure success',
    type: 'course',
    duration: '7m',
    content: `## Report and Measure Success

Master the art of measuring campaign performance and optimizing for results.

### Key Metrics:
- **ACoS** (Advertising Cost of Sale)
- **RoAS** (Return on Ad Spend)
- **CTR** (Click-Through Rate)
- **CVR** (Conversion Rate)
- **NTB** (New-to-Brand)

### Measurement Tools:
- Campaign dashboard analytics
- Search term reports
- Attribution modeling
- Brand lift studies
`,
    completed: false,
  },
];

export default async function CertificationDetailPage({ params }: Props) {
  const { slug } = await params;
  const certification = await getCertificationBySlug(slug);

  if (!certification) {
    notFound();
  }

  const isOperatorCredential = certification.track === 'operator-credential';
  const totalModules = courseModules.length;
  const completedModules = 0; // Would be tracked in a real app
  const progressPercentage = (completedModules / totalModules) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/academy/certifications"
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Certifications
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={isOperatorCredential ? 'default' : 'secondary'}
              className="text-xs"
            >
              {isOperatorCredential
                ? 'ScaleSmart Credential'
                : 'Amazon-Aligned'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {certification.level}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Certification Path
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
                {certification.title}
              </h1>
              <p className="text-base text-muted-foreground max-w-3xl">
                {certification.shortDescription}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-6 py-4 border-y border-border/60">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{certification.duration}</span>
              <span className="text-muted-foreground">total time</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{totalModules}</span>
              <span className="text-muted-foreground">modules</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-amber-500" />
              <span className="font-medium">1</span>
              <span className="text-muted-foreground">practice assessment</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{certification.badgeLabel}</span>
              <span className="text-muted-foreground">badge earned</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Your Progress</span>
              <span className="text-muted-foreground">
                {completedModules}/{totalModules} modules completed
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="learn" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="learn" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Learn
                </TabsTrigger>
                <TabsTrigger value="practice" className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Practice Assessment
                </TabsTrigger>
              </TabsList>

              {/* Learn Tab */}
              <TabsContent value="learn" className="space-y-4">
                {courseModules.map((module, index) => (
                  <Card
                    key={module.id}
                    className="overflow-hidden border-border/80 hover:border-amber-500/50 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {module.title}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              {module.type === 'video' ? (
                                <Video className="h-3 w-3" />
                              ) : (
                                <BookOpen className="h-3 w-3" />
                              )}
                              <span>{module.duration}</span>
                            </CardDescription>
                          </div>
                        </div>
                        {module.type === 'video' && (
                          <Badge variant="secondary" className="text-xs">
                            <Play className="h-3 w-3 mr-1" />
                            Video
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {module.type === 'video' ? (
                        <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                          <video
                            controls
                            className="w-full h-full"
                            poster="/academy/video-placeholder.jpg"
                          >
                            <source src={module.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
                          <MDXRemote
                            source={module.content || ''}
                            components={{}}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Practice Assessment Tab */}
              <TabsContent value="practice" className="space-y-6">
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-6 w-6 text-amber-500" />
                      <div>
                        <CardTitle>Practice Assessment</CardTitle>
                        <CardDescription>
                          Test your knowledge before taking the official
                          certification exam
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm mb-4">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        15 questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        ~20 minutes
                      </span>
                      <Badge variant="outline">Optional</Badge>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      {practiceAssessmentQuestions.map((q, idx) => (
                        <AccordionItem key={q.id} value={`question-${q.id}`}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-start gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-sm font-medium">
                                {q.question}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pl-9">
                              {q.options.map((option, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`p-3 rounded-lg border text-sm ${
                                    optIdx === q.correctAnswer
                                      ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
                                      : 'border-border/60 hover:bg-muted/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {optIdx === q.correctAnswer && (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                    {option}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    <div className="mt-6 pt-4 border-t border-border/60">
                      <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
                        Start Practice Assessment
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Certification Info Card */}
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base">
                  About This Certification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {certification.description}
                </p>

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    What You'll Learn
                  </h4>
                  <ul className="space-y-2">
                    {certification.topics.map((topic, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                {certification.operatorFocus && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs font-medium text-foreground/90">
                      💡 {certification.operatorFocus}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Steps Card */}
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    <Play className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Start Learning</p>
                    <p className="text-xs text-muted-foreground">
                      Begin with the welcome video
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Take Practice Test</p>
                    <p className="text-xs text-muted-foreground">
                      Test your knowledge
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-slate-950">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">
                      Earn Certification
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pass the final assessment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Certifications */}
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base">Related Paths</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link
                    href="/academy/certifications#sponsored-ads-certification"
                    className="block p-3 rounded-lg border border-border/60 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
                  >
                    <p className="text-sm font-medium group-hover:text-amber-500 transition-colors">
                      Sponsored Ads Certification
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Beginner • 2.4 hrs
                    </p>
                  </Link>

                  <Link
                    href="/academy/certifications#amazon-video-ads-certification"
                    className="block p-3 rounded-lg border border-border/60 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
                  >
                    <p className="text-sm font-medium group-hover:text-amber-500 transition-colors">
                      Amazon Video Ads Certification
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Intermediate • 2.0 hrs
                    </p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-border/80 bg-white/50 dark:bg-slate-950/50 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold mb-1">
                Ready to get certified?
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete all modules and pass the assessment to earn your
                credential
              </p>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-8">
              <Trophy className="h-4 w-4 mr-2" />
              Begin Certification Journey
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

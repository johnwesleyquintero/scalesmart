'use client';

import { Badge, Card, CardContent } from '@/components/ui';
import type { Experience, Skill } from '@/lib/types';
import {
  Brain,
  Code,
  Database,
  LineChart,
  Loader2,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Define the constant for the repeated string
const SKILLS_B2B_MANAGEMENT = 'Skills: B2B, Management';

// Update the fallback skills to match your expertise areas
const fallbackSkills: Skill[] = [
  {
    name: 'Data Analytics',
    level: 95,
    icon: 'LineChart',
  },
  {
    name: 'Programming (Python/R/JS)',
    level: 90,
    icon: 'Code',
  },
  {
    name: 'Machine Learning',
    level: 85,
    icon: 'Brain',
  },
  {
    name: 'Database Management',
    level: 90,
    icon: 'Database',
  },
  {
    name: 'AI Automation',
    level: 95,
    icon: 'Workflow',
  },
];

// Update the fallback experience to match your latest experience
const fallbackExperience: Experience[] = [
  {
    title: 'Founder/Developer',
    company: 'Nebula-Singularity: SellSmart',
    period: 'Jan 2025 - Present',
    description: 'All-in-One Amazon Seller Platform',
    achievements: [
      'Developed AI-powered tools for Amazon sellers',
      'Created data visualization dashboards for seller insights',
      'Automated listing optimization and inventory management',
    ],
  },
  {
    title: 'Amazon Specialist 2',
    company: 'My Amazon Guy',
    period: 'Oct 2024 - Mar 2025',
    description: 'Skills: Data Visualization, Amazon SEO',
    achievements: [
      'Implemented data visualization solutions for client reporting',
      'Optimized Amazon SEO strategies for multiple clients',
      'Increased client sales by an average of 35% through strategic optimizations',
    ],
  },
  {
    title: 'Item Specialist',
    company: 'Bulk Buy America',
    period: 'Mar 2024 - Sep 2024',
    description: 'Remote US • Skills: VLOOKUP, Price Checker',
    achievements: [
      'Utilized VLOOKUP and advanced Excel functions for inventory management',
      'Developed custom price checker tools to optimize competitive pricing',
      'Streamlined inventory processes resulting in 25% efficiency improvement',
    ],
  },
  {
    title: 'Marketplace Support',
    company: 'Adorama',
    period: 'May 2023 - Sep 2023',
    description: SKILLS_B2B_MANAGEMENT, // Use the constant
    achievements: [
      'Managed client relationships and marketplace integrations',
      'Implemented efficient management processes',
      'Provided technical support for marketplace operations',
    ],
  },
  {
    title: 'Amazon Account Manager',
    company: 'Champion E-com LLC',
    period: 'Oct 2022 - Sep 2023',
    description: SKILLS_B2B_MANAGEMENT, // Use the constant
    achievements: [
      'Oversaw account health and performance metrics',
      'Developed management strategies for multiple clients',
      'Implemented best practices for Amazon marketplace success',
    ],
  },
  {
    title: 'Amazon Wholesale Buyer',
    company: 'Sales.support',
    period: 'Oct 2018 - Jul 2022',
    description: 'Skills: B2B, Management',
    achievements: [
      'Identified profitable wholesale opportunities',
      'Negotiated with suppliers for optimal pricing',
      'Implemented inventory management systems',
    ],
  },
];

const education = [
  {
    degree: "Bachelor's degree, Elementary Education and Teaching",
    institution: 'University of Southeastern Philippines',
    period: '2015 - 2019',
    description:
      'Licensed Professional Teacher with focus on educational technology.',
  },
  {
    degree: 'Educational Technology',
    institution: 'Iowa State University',
    period: 'May 2018',
    description: 'Specialized training in educational technology applications.',
  },
  {
    degree: 'Information Technology',
    institution: 'Magugpo Institute of Technology',
    period: '2014',
    description:
      'Foundation in information technology principles and applications.',
  },
];

export default function AboutSection() {
  const [skills, setSkills] = useState<Skill[]>(fallbackSkills);
  const [experience, setExperience] =
    useState<Experience[]>(fallbackExperience);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchContent() {
      try {
        console.log('Fetching /api/content with GET method');
        const res = await fetch('/api/content', { method: 'GET' });
        console.log('Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();

        // Only update state if we got valid data
        if (data.skills && data.skills.length > 0) {
          setSkills(data.skills);
        }

        if (data.experience && data.experience.length > 0) {
          setExperience(data.experience);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to load content. Using fallback data.');
        // Fallback data is already set in state
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, []);

  // Function to get the appropriate icon component
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'LineChart':
        return <LineChart className="h-5 w-5 text-primary" />;
      case 'Code':
        return <Code className="h-5 w-5 text-primary" />;
      case 'Brain':
        return <Brain className="h-5 w-5 text-primary" />;
      case 'Database':
        return <Database className="h-5 w-5 text-primary" />;
      case 'Workflow':
        return <Workflow className="h-5 w-5 text-primary" />;
      default:
        return <Sparkles className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <section id="about" className="container relative mx-auto px-4 py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-blue-950/50 dark:to-purple-950/50 blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <Badge variant="secondary" className="mb-4">
            About Me
          </Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Experience & Skills
          </h2>
          <p className="text-xl text-muted-foreground">
            Data-Driven Amazon & E-commerce Specialist with expertise in
            automation and insights generation.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading experience and skills...
              </p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
                <p>{error}</p>
              </div>
            )}
            {!error && (
              <div className="grid gap-12 md:grid-cols-2">
                <div className="space-y-8">
                  <Card className="overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="mb-4 text-xl font-semibold">
                        Technical Expertise
                      </h3>
                      <div className="space-y-6">
                        {skills.map((skill) => (
                          <div key={skill.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getIconComponent(skill.icon)}
                                <span className="font-medium">
                                  {skill.name}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {skill.level}%
                              </span>
                            </div>
                            <div
                              role="progressbar"
                              aria-valuenow={skill.level}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              className="h-2 w-full rounded-full bg-gray-200"
                            >
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${skill.level}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="mb-4 text-xl font-semibold">Education</h3>
                      <div className="space-y-4">
                        {education.map((edu, index) => (
                          <div
                            key={index}
                            className="border-l-2 border-primary/20 pl-4"
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold">{edu.degree}</h4>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {edu.institution}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {edu.period}
                            </p>
                            <p className="mt-2 text-sm">{edu.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="mb-6 text-xl font-semibold">
                        Professional Journey
                      </h3>
                      <div className="space-y-8">
                        {experience.map((exp, index) => (
                          <div
                            key={index}
                            className="relative border-l-2 border-primary/20 pl-4"
                          >
                            <div className="absolute -left-[9px] top-[6px] h-4 w-4 rounded-full border-2 border-primary bg-background"></div>
                            <div>
                              <h4 className="font-semibold">{exp.title}</h4>
                              <p className="text-sm font-medium text-primary">
                                {exp.company}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {exp.period}
                              </p>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {exp.description}
                              </p>
                              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                                {exp.achievements.map((achievement, i) => (
                                  <li key={i}>{achievement}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

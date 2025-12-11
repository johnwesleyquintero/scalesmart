'use client';

import React, { ReactNode } from 'react'; // Explicitly import React and ReactNode
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

// Type definitions for data structures
interface Skill {
  name: string;
  level: number;
  icon: string; // Corresponds to key in LucideIconMap
}

interface ExperienceItem {
  // Renamed from Experience to avoid conflict with imported type if it exists and is different
  title: string;
  company: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  achievements?: string[];
}

interface EducationItem {
  // Renamed from Education to avoid potential conflicts
  institution: string;
  degree: string;
  period?: string;
  description?: string;
  skills?: string[];
}

// Assume data structure matches these interfaces
interface SkillsData {
  skills: Skill[];
}

interface ExperienceData {
  experience: ExperienceItem[];
}

interface EducationData {
  education: EducationItem[];
}

// Import data with types
import educationData from '@/data/portfolio-data/education.json';
import experienceData from '@/data/portfolio-data/experience.json';
import skillsData from '@/data/portfolio-data/skills.json';

// Import Lucide icons
import {
  Briefcase,
  GraduationCap,
  Lightbulb,
  ShoppingBag,
  Search,
  DollarSign,
  Truck,
  BarChart2,
  LineChart,
  PieChart,
  FileText,
  Table,
  Code,
  Share2,
  Wrench, // <--- Wrench is the correct import for a 'Tool' icon
  Brain,
  Workflow,
  Database,
  Cloud,
  GitBranch,
} from 'lucide-react';

// Map string icon names to Lucide components outside the component
const LucideIconMap: { [key: string]: React.ElementType } = {
  ShoppingBag,
  Search,
  DollarSign,
  Truck,
  BarChart2,
  LineChart,
  PieChart,
  FileText,
  Lightbulb,
  Table,
  Code,
  Api: Share2,
  Tool: Wrench,
  Brain,
  Workflow,
  Database, // <--- Corrected: Tool now maps to Wrench
  Cloud,
  GitBranch,
};

// Import CSS module styles
import styles from './about-section.module.css';

// Reusable Timeline Item Component
interface TimelineItemProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  period?: string;
  description?: string;
  footerContent?: ReactNode;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  icon: Icon,
  title,
  subtitle,
  period,
  description,
  footerContent,
}) => {
  return (
    // This outer div uses layout styling common to timeline items
    <div className="relative pl-10 pb-4 last:pb-0 border-l border-border/50 ml-3 pt-1">
      {/* Absolute icon container */}
      <div className="absolute -left-[15px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      {/* Content */}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-base font-medium text-muted-foreground">{subtitle}</p>
      {period && (
        <p className="text-xs text-muted-foreground/80 mb-1">{period}</p>
      )}
      {description && (
        <p className="text-muted-foreground mt-2">{description}</p>
      )}
      {footerContent && <div className="mt-2">{footerContent}</div>}
    </div>
  );
};

// Main AboutSection component
export default function AboutSection() {
  const skills = skillsData.skills || [];
  const experience = experienceData.experience || [];
  const education = educationData.education || [];

  return (
    <section id="about" className={styles.aboutSection}>
      <div className={`${styles.container} container mx-auto px-4`}>
        <div className={`${styles.headingContainer} mb-16 text-center`}>
          <h2
            className={`${styles.sectionHeading} text-3xl font-bold tracking-tight sm:text-4xl`}
          >
            About Me
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
            I&apos;m a passionate and results-oriented professional with a
            strong background in e-commerce, data analysis, and full-stack
            development. My journey is driven by a constant desire to learn,
            innovate, and create impactful solutions.
          </p>
        </div>

        <div className="space-y-12">
          {/* Skills Section */}
          {skills.length > 0 && (
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-card-foreground/5 dark:bg-card-foreground/10">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl font-semibold">
                    My Skillset
                  </CardTitle>
                </div>
                <CardDescription>
                  A snapshot of my technical and professional abilities.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-3">
                  {skills.map(({ name, icon }, index) => {
                    const IconComponent = LucideIconMap[icon];
                    return (
                      <Badge
                        key={`skill-${index}`} // Added a prefix to keys
                        variant="secondary"
                        className={`${styles.skillBadge} px-3 py-1 text-sm hover:bg-primary/20 transition-colors flex items-center gap-1`}
                      >
                        {IconComponent && <IconComponent className="h-4 w-4" />}
                        {name}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Experience Section */}
          {experience.length > 0 && (
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-card-foreground/5 dark:bg-card-foreground/10">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl font-semibold">
                    Professional Experience
                  </CardTitle>
                </div>
                <CardDescription>
                  My career journey and key accomplishments.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {experience.map((exp, index) => (
                  <TimelineItem
                    key={`exp-${index}`} // Added a prefix to keys
                    icon={Briefcase}
                    title={exp.title}
                    subtitle={exp.company}
                    period={
                      exp.startDate || exp.endDate
                        ? `${exp.startDate ? exp.startDate : ''}${exp.endDate ? ` - ${exp.endDate}` : ' - Present'}`
                        : undefined
                    }
                    description={exp.description}
                    footerContent={
                      exp.achievements && exp.achievements.length > 0 ? (
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          {exp.achievements.map((achievement, idx) => (
                            <li key={`ach-${idx}`}>{achievement}</li>
                          ))}
                        </ul>
                      ) : undefined
                    }
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-card-foreground/5 dark:bg-card-foreground/10">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl font-semibold">
                    Education & Learning
                  </CardTitle>
                </div>
                <CardDescription>
                  My academic background and commitment to continuous learning.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {education.map((edu, index) => (
                  <TimelineItem
                    key={`edu-${index}`} // Added a prefix to keys
                    icon={GraduationCap}
                    title={edu.degree}
                    subtitle={edu.institution}
                    period={edu.period}
                    description={edu.description}
                    footerContent={
                      edu.skills && edu.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {edu.skills.map((skill, idx) => (
                            <Badge key={`edu-skill-${idx}`} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : undefined
                    }
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

import React, { ReactNode } from 'react'; // Explicitly import React and ReactNode
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
  period?: string;
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

interface OperatingPrinciple {
  title: string;
  description: string;
}

interface DailyRhythm {
  title: string;
  description: string;
  tasks: string[];
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
import personalData from '@/data/portfolio-data/personal.json';
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
  ShieldCheck,
  Target,
  Users,
  Zap,
  Clock,
  CheckCircle2,
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
  const experience = (experienceData.experience as ExperienceItem[]) || [];
  const education = (educationData.education as EducationItem[]) || [];
  const operatingPrinciples =
    ((personalData as any).operatingPrinciples as OperatingPrinciple[]) || [];
  const dailyRhythm =
    ((personalData as any).dailyRhythm as DailyRhythm[]) || [];

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
                      exp.period ||
                      (exp.startDate || exp.endDate
                        ? `${exp.startDate ? exp.startDate : ''}${exp.endDate ? ` - ${exp.endDate}` : ' - Present'}`
                        : undefined)
                    }
                    description={exp.description}
                    footerContent={
                      exp.achievements && exp.achievements.length > 0 ? (
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          {exp.achievements.map((achievement: string, idx: number) => (
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

          {/* Operating Principles Section */}
          {operatingPrinciples.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
                <CardHeader className="bg-card-foreground/5 dark:bg-card-foreground/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl font-semibold">
                      Operating Principles
                    </CardTitle>
                  </div>
                  <CardDescription>
                    The core values that guide my professional work.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {operatingPrinciples.map(
                      (principle: OperatingPrinciple, index: number) => (
                      <div key={`principle-${index}`} className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <CheckCircle2 className="h-5 w-5 text-primary/60" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {principle.title}
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            {principle.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Rhythm Section */}
              {dailyRhythm.length > 0 && (
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-secondary">
                  <CardHeader className="bg-card-foreground/5 dark:bg-card-foreground/10 pb-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-6 w-6 text-secondary" />
                      <CardTitle className="text-2xl font-semibold">
                        Daily Rhythm
                      </CardTitle>
                    </div>
                    <CardDescription>
                      How I maintain account health and drive growth daily.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {dailyRhythm.map((rhythm: DailyRhythm, index: number) => (
                      <div key={`rhythm-${index}`} className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <Zap className="h-4 w-4 text-secondary" />
                            {rhythm.title}
                          </h4>
                          <p className="text-muted-foreground text-sm mt-1">
                            {rhythm.description}
                          </p>
                        </div>
                        <ul className="space-y-2">
                          {rhythm.tasks.map((task: string, tIdx: number) => (
                            <li
                              key={`task-${tIdx}`}
                              className="text-sm text-muted-foreground flex gap-2"
                            >
                              <span className="text-secondary font-bold">
                                •
                              </span>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
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

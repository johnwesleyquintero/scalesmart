'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import educationData from '@/data/portfolio-data/education.json';
import experienceData from '@/data/portfolio-data/experience.json';
import skillsData from '@/data/portfolio-data/skills.json';
import { Briefcase, GraduationCap, Lightbulb } from 'lucide-react';

import styles from './about-section.module.css';
// Define the constant for the repeated string

export default function AboutSection() {
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
          {skillsData.skills?.length > 0 && (
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
                  {skillsData.skills.map(
                    (skill: { name: string; level: number; icon: string }) => (
                      <Badge
                        key={skill.name}
                        variant="secondary"
                        className={`${styles.skillBadge} px-3 py-1 text-sm hover:bg-primary/20 transition-colors`}
                      >
                        {skill.name}
                        {skill.level && (
                          <span className={styles.skillLevel}>
                            ({skill.level})
                          </span>
                        )}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Experience Section */}
          {experienceData.experience?.length > 0 && (
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
                {experienceData.experience.map(
                  (
                    exp: {
                      title: string;
                      company: string;
                      period: string;
                      description: string;
                      achievements: string[];
                      startDate: string;
                      endDate: string | null;
                    },
                    index: number,
                  ) => (
                    <div
                      key={index}
                      className={`${styles.experienceItem} relative pl-10 pb-4 last:pb-0 border-l border-border/50 ml-3 pt-1`}
                    >
                      <div
                        className={`${styles.iconContainer} absolute -left-[15px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground`}
                      >
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <h3 className={styles.experienceTitle}>{exp.title}</h3>
                      <p className={styles.experienceCompany}>{exp.company}</p>
                      {(exp.startDate || exp.endDate) && (
                        <p className={styles.experiencePeriod}>
                          {exp.startDate ? exp.startDate : ''}
                          {exp.endDate ? ` - ${exp.endDate}` : ' - Present'}
                        </p>
                      )}
                      <p className={styles.experienceDescription}>
                        {exp.description}
                      </p>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          )}

          {/* Education Section */}
          {educationData.education?.length > 0 && (
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
                {educationData.education.map(
                  (
                    edu: {
                      institution: string;
                      degree: string;
                      period: string;
                      description: string;
                      skills: string[];
                    },
                    index: number,
                  ) => (
                    <div
                      key={index}
                      className="relative pl-10 pb-4 last:pb-0 border-l border-border/50 ml-3 pt-1"
                    >
                      <div className="absolute -left-[15px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {edu.degree}
                      </h3>
                      <p className="text-base font-medium text-muted-foreground">
                        {edu.institution}
                      </p>

                      {edu.period && (
                        <p className="text-xs text-muted-foreground/80 mb-1">
                          {edu.period}
                        </p>
                      )}
                      {/* You can add edu.details here if available */}
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

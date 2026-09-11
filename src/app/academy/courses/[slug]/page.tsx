import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CourseHero from '@/components/academy/CourseHero';
import ScenarioLab from '@/components/academy/ScenarioLab';
import { getCourseBySlug, getAllCourses } from '@/data/academy/courses-data';
import { getCourseLessons } from '@/lib/academy-mdx';
import LessonSidebar from '@/components/academy/LessonSidebar';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return {
      title: 'Course Not Found | ScaleSmart Academy',
      description: 'The requested course could not be found.',
    };
  }

  return {
    title: `${course.title} | ScaleSmart Academy`,
    description: course.description,
  };
}

export async function generateStaticParams() {
  const courses = await getAllCourses();
  return courses.map((c) => ({ slug: c.slug }));
}

export default async function CourseOverviewPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const lessons = await getCourseLessons(slug);
  const firstLesson = lessons[0];
  const hasLessons = lessons.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <CourseHero course={course} lessons={lessons} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <LessonSidebar
            lessons={lessons}
            currentSlug="__overview__"
            courseSlug={course.slug}
          />

          <main className="min-w-0 w-full lg:col-span-9 xl:col-span-9 space-y-10">
            {/* Lessons Overview */}
            {hasLessons ? (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                      Course Lessons
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Work through each lesson in sequence.
                    </p>
                  </div>
                </div>
                <ol className="space-y-3">
                  {lessons.map((lesson, idx) => (
                    <li key={lesson.slug}>
                      <Link
                        href={`/academy/courses/${course.slug}/${lesson.slug}`}
                        className="group flex items-start gap-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm hover:border-amber-500/40 hover:shadow-md transition-all"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 font-bold text-sm group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted border border-border/60 text-muted-foreground">
                              Lesson {lesson.lessonNumber}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {lesson.level}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                              <Clock className="h-3 w-3" />
                              {lesson.duration}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 leading-snug">
                            {lesson.title}
                          </h3>
                          {lesson.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="hidden sm:block h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all mt-3" />
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ) : (
              <section className="rounded-3xl border border-border/80 bg-card p-8 sm:p-10 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-muted mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Lessons coming soon
                </h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-lg mx-auto">
                  Structured MDX lessons for this module are being authored. In
                  the meantime, jump straight to the scenario lab to train your
                  operational instincts.
                </p>
                <Button
                  asChild
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl"
                >
                  <Link href={`/academy/courses/${course.slug}/scenario-lab`}>
                    Jump to Scenario Lab
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </section>
            )}

            {/* Scenario Lab Preview */}
            <section id="scenario-lab">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                    Scenario Lab
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Test your decision-making against live account situations.
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
                <ScenarioLab courseSlug={course.slug} />
              </div>
            </section>

            {/* Course Topics Checklist */}
            <section className="rounded-3xl border border-border/80 bg-gradient-to-br from-slate-50 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-6 sm:p-8">
              <h2 className="text-xl font-extrabold tracking-tight text-foreground mb-5">
                What you&apos;ll master in this module
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {course.topics.map((topic, i) => (
                  <li
                    key={i}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border border-border/60 bg-card/70 p-4',
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-foreground/90 leading-relaxed">
                      {topic}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Bottom CTA */}
            {hasLessons && firstLesson && (
              <section className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      Ready to start learning?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Begin with{' '}
                      <strong className="text-foreground">
                        {firstLesson.title}
                      </strong>
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl w-full sm:w-auto"
                >
                  <Link
                    href={`/academy/courses/${course.slug}/${firstLesson.slug}`}
                  >
                    Start First Lesson
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

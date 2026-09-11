import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Course, COURSE_SOURCES } from '@/types/academy';
import { LessonMeta } from '@/lib/academy-mdx';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseHeroProps {
  course: Course;
  lessons: LessonMeta[];
  className?: string;
}

const levelColors: Record<string, string> = {
  Beginner:
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  Intermediate:
    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Advanced:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Expert:
    'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

export default function CourseHero({ course, lessons }: CourseHeroProps) {
  const firstLesson = lessons[0];
  const firstLessonHref = firstLesson
    ? `/academy/courses/${course.slug}/${firstLesson.slug}`
    : '#';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg my-6">
      {/* Background gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left: Course Identity */}
        <div className="lg:col-span-7 p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-border/60">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
            <Link
              href="/academy"
              className="hover:text-foreground transition-colors"
            >
              Academy
            </Link>
            <span>/</span>
            <Link
              href="/academy#courses"
              className="hover:text-foreground transition-colors"
            >
              Courses
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{course.title}</span>
          </div>

          {/* Source badge */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border',
                course.source === COURSE_SOURCES.AMAZON_ACADEMY
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {course.source}
            </span>

            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                levelColors[course.level] || levelColors['Beginner'],
              )}
            >
              {course.level}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
            {course.title}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
            {course.description}
          </p>

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground mb-8 border-b border-border/60 pb-6">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" />
              {course.duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-amber-500" />
              {lessons.length} Lessons
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-amber-500" />
              {course.modulesCount} Modules
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-amber-500" />
              ScaleSmart Academy
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl px-7 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <Link href={firstLessonHref}>
                Start Course
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-border/80 rounded-xl font-medium"
            >
              <a href="#scenario-lab">
                <Zap className="mr-2 h-4 w-4 text-amber-500" />
                Jump to Scenario Lab
              </a>
            </Button>
          </div>
        </div>

        {/* Right: What you'll learn */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-muted/30">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-5">
            What you&apos;ll learn
          </h2>

          <ul className="space-y-3 mb-8">
            {course.topics.map((topic, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-foreground/90 font-medium"
              >
                <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{topic}</span>
              </li>
            ))}
          </ul>

          {/* Operator Takeaway Box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2.5">
              <span className="text-amber-500 text-lg shrink-0">💡</span>
              <div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                  Coach Wesley&apos;s Operator Edge
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {course.operatorTakeaway}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

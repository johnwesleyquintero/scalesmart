import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseBySlug, getAllCourses } from '@/data/academy/courses-data';
import { getCourseLessons } from '@/lib/academy-mdx';
import ScenarioLab from '@/components/academy/ScenarioLab';
import LessonSidebar from '@/components/academy/LessonSidebar';
import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return {
      title: 'Scenario Lab Not Found | ScaleSmart Academy',
    };
  }

  return {
    title: `Scenario Lab | ${course.title} | ScaleSmart Academy`,
    description: `Test your operational skills in the scenario lab for ${course.title}.`,
  };
}

export async function generateStaticParams() {
  const courses = await getAllCourses();
  return courses.map((c) => ({ slug: c.slug }));
}

export default async function ScenarioLabPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const lessons = await getCourseLessons(slug);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
          <Link
            href={`/academy/courses/${course.slug}`}
            className="hover:text-foreground transition-colors"
          >
            {course.title}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium inline-flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-500" />
            Scenario Lab
          </span>
        </div>

        {/* Mobile back to course */}
        <div className="lg:hidden mb-4">
          <Button
            asChild
            variant="outline"
            className="border-border/80 rounded-xl text-xs font-medium"
          >
            <Link href={`/academy/courses/${course.slug}`}>
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to Course Overview
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                <Zap className="h-3 w-3" />
                Operational Practice
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-1.5 leading-tight">
                Scenario Lab — {course.title}
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Battle-tested decision drills. Each scenario forces you to
                choose between multiple plausible moves — Coach Wesley walks you
                through the correct operator reasoning afterward.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <LessonSidebar
            lessons={lessons}
            currentSlug="scenario-lab"
            courseSlug={course.slug}
          />

          <main className="min-w-0 w-full lg:col-span-9 xl:col-span-9">
            <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-6 md:p-8 shadow-sm">
              <ScenarioLab courseSlug={course.slug} />
            </div>

            {/* Bottom return to overview */}
            <div className="mt-10 flex justify-between items-center">
              <Button
                asChild
                variant="outline"
                className="border-border/80 rounded-xl text-sm font-medium"
              >
                <Link href={`/academy/courses/${course.slug}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Course Overview
                </Link>
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

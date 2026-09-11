import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseBySlug, getAllCourses } from '@/data/academy/courses-data';
import { getCourseLessons, getLessonBySlug } from '@/lib/academy-mdx';
import LessonReader from '@/components/academy/LessonReader';
import LessonSidebar from '@/components/academy/LessonSidebar';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ slug: string; lessonSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  const course = await getCourseBySlug(slug);
  const lesson = course ? await getLessonBySlug(slug, lessonSlug) : null;

  if (!course || !lesson) {
    return {
      title: 'Lesson Not Found | ScaleSmart Academy',
    };
  }

  return {
    title: `${lesson.title} | ${course.title} | ScaleSmart Academy`,
    description: lesson.description || course.description,
  };
}

export async function generateStaticParams() {
  const courses = await getAllCourses();
  const params: { slug: string; lessonSlug: string }[] = [];
  for (const course of courses) {
    const lessons = await getCourseLessons(course.slug);
    for (const lesson of lessons) {
      params.push({ slug: course.slug, lessonSlug: lesson.slug });
    }
  }
  return params;
}

export default async function LessonPage({ params }: Props) {
  const { slug, lessonSlug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const lesson = await getLessonBySlug(slug, lessonSlug);
  if (!lesson) notFound();

  const lessons = await getCourseLessons(slug);
  const currentIndex = lessons.findIndex((l) => l.slug === lesson.slug);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < lessons.length - 1
      ? lessons[currentIndex + 1]
      : null;

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
          <span className="text-foreground font-medium truncate max-w-[240px]">
            {lesson.title}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <LessonSidebar
            lessons={lessons}
            currentSlug={lesson.slug}
            courseSlug={course.slug}
          />

          <div className="min-w-0 w-full lg:col-span-9 xl:col-span-9">
            <LessonReader
              lesson={lesson}
              prevLesson={prevLesson}
              nextLesson={nextLesson}
              courseSlug={course.slug}
            />

            {/* Desktop-only bottom return to overview */}
            <div className="hidden lg:flex mt-10">
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
          </div>
        </div>
      </div>
    </div>
  );
}

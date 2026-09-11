'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LessonMeta } from '@/lib/academy-mdx';
import { BookOpen, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonSidebarProps {
  lessons: LessonMeta[];
  currentSlug: string;
  courseSlug: string;
}

export default function LessonSidebar({
  lessons,
  currentSlug,
  courseSlug,
}: LessonSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const SidebarContent = () => (
    <div className="space-y-1">
      {/* Lessons */}
      <div className="mb-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-2 pb-2">
          Course Lessons
        </div>
        {lessons.map((lesson, idx) => {
          const isActive = lesson.slug === currentSlug;
          return (
            <Link
              key={lesson.slug}
              href={`/academy/courses/${courseSlug}/${lesson.slug}`}
              className={cn(
                'group flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                isActive
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              onClick={() => setIsOpen(false)}
            >
              {/* Lesson number indicator */}
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5',
                  isActive
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-muted-foreground/20 text-muted-foreground group-hover:bg-muted-foreground/30',
                )}
              >
                {idx + 1}
              </span>

              <div className="min-w-0">
                <div className="leading-snug truncate">{lesson.title}</div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mt-0.5 font-normal">
                  <Clock className="h-2.5 w-2.5" />
                  {lesson.duration}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Scenario Lab Link */}
      <div className="pt-3 border-t border-border/60">
        <Link
          href={`/academy/courses/${courseSlug}/scenario-lab`}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
            currentSlug === 'scenario-lab'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20',
          )}
          onClick={() => setIsOpen(false)}
        >
          <Zap className="h-4 w-4 shrink-0" />
          <span>Scenario Lab (5 Challenges)</span>
        </Link>
      </div>

      {/* Back to Course */}
      <div className="pt-2">
        <Link
          href={`/academy/courses/${courseSlug}`}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          onClick={() => setIsOpen(false)}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Back to Course Overview
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-2xl border border-border/80 bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-500" />
            Course Contents
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {isOpen && (
          <div className="mt-2 rounded-2xl border border-border/80 bg-card px-4 py-4 shadow-md">
            <SidebarContent />
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
        <div className="sticky top-8 rounded-2xl border border-border/80 bg-card px-4 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/60">
            <BookOpen className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-foreground">
              Course Contents
            </span>
          </div>
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}

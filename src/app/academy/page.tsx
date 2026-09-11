import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AcademyHero from '@/components/academy/AcademyHero';
import AcademyNavTabs from '@/components/academy/AcademyNavTabs';
import OperatorCallout from '@/components/academy/OperatorCallout';
import AcademyFaqSection from '@/components/academy/AcademyFaqSection';
import { coursesData } from '@/data/academy/courses';
import { learningPathsData } from '@/data/academy/learning-paths';
import { certificationsData } from '@/data/academy/certifications';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  ShieldCheck,
  Trophy,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'ScaleSmart Academy | Amazon Operations & PPC Certification Portal',
  description:
    'Learn Amazon and E-commerce operations from real-world systems, battle-tested scenarios, and Coach Wesley operator thinking. Aligned with Amazon Ads Academy with practical execution playbooks.',
};

export default function AcademyPage() {
  const featuredCourses = coursesData.filter((c) => c.featured);
  const featuredCert =
    certificationsData.find((c) => c.featured) || certificationsData[0];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-10">
      {/* Academy Navigation Tabs */}
      <AcademyNavTabs />

      {/* Hero Section */}
      <AcademyHero
        title="ScaleSmart Academy"
        subtitle="Learn Amazon & E-commerce Operations from real-world systems, battle-tested scenarios, and operator thinking."
        eyebrow="Official Concepts + Coach Wesley Operator Judgment"
        primaryCtaText="Explore Certifications"
        primaryCtaHref="/academy/certifications"
        secondaryCtaText="Browse Featured Courses"
        secondaryCtaHref="#courses"
      />

      {/* Explore Category Cards */}
      <section className="my-12">
        <div className="text-center sm:text-left mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Explore the Academy
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose how you want to build your operational competencies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link
            href="/academy/certifications"
            className="group p-6 rounded-2xl border border-border/80 bg-card hover:border-amber-500/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <Trophy className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {certificationsData.length} Credentials
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-amber-500 transition-colors">
              Certifications & Badges
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Earn Amazon-aligned credentials and ScaleSmart Operator
              certifications with shareable badges.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-500">
              <span>View certifications</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <a
            href="#paths"
            className="group p-6 rounded-2xl border border-border/80 bg-card hover:border-amber-500/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Layers className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {learningPathsData.length} Structured Tracks
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">
              Learning Paths
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Step-by-step master tracks taking you from foundational
              advertising to managing 7-figure brand catalogs.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-blue-500">
              <span>Explore paths</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </a>

          <a
            href="#courses"
            className="group p-6 rounded-2xl border border-border/80 bg-card hover:border-amber-500/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {coursesData.length} Modules
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors">
              Courses & Scenario Labs
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Deep-dive operational lessons, bid math guides, and live
              troubleshooting case studies.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-emerald-500">
              <span>Browse courses</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </a>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section id="courses" className="my-14 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500 mb-1.5">
              <span>Operator Curriculum</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Featured Learning Modules
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Curated courses combining Amazon reference theory with battlefield
              operational playbooks.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border/80"
          >
            <Link href="/academy/certifications">
              View all {certificationsData.length} certifications
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCourses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border/60">
                    {course.level}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-500" />
                    {course.duration}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 leading-snug">
                  {course.title}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {course.description}
                </p>

                <div className="space-y-1.5 mb-5">
                  {course.topics.slice(0, 3).map((topic, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-1.5 text-xs text-muted-foreground"
                    >
                      <span className="text-amber-500 font-bold shrink-0">
                        ✓
                      </span>
                      <span className="line-clamp-1">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-foreground/90 font-medium mb-4">
                  {course.operatorTakeaway}
                </div>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full justify-between rounded-xl font-medium border-border/80 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-colors"
                >
                  <Link href={`/academy/certifications#${featuredCert.slug}`}>
                    <span>View course module</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The Coach Wesley Layer / Operator Philosophy */}
      <OperatorCallout />

      {/* Learning Paths Section */}
      <section id="paths" className="my-16 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500 mb-1.5">
            <span>End-to-End Progression</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Structured Learning Paths
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Sequential stages engineered to develop operational instincts,
            eliminate blind spots, and prepare you for certified mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {learningPathsData.map((path) => (
            <div
              key={path.id}
              className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Compass className="h-3.5 w-3.5" />
                    {path.level} Path
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {path.estimatedTime}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                  {path.title}
                </h3>
                <div className="text-xs font-semibold text-amber-500 mb-3">
                  {path.tagline}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {path.description}
                </p>

                {/* Progress Stages */}
                <div className="space-y-3 mb-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Roadmap Progression:
                  </div>
                  {path.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-muted/60 border border-border/50 flex items-start gap-3"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {step.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  Target Credential:{' '}
                  <strong className="text-foreground">
                    {path.targetCredential}
                  </strong>
                </div>
                <Button
                  asChild
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl text-xs px-5"
                >
                  <Link href="/academy/certifications">
                    Explore Path
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why ScaleSmart Academy Comparison Table */}
      <section className="my-16">
        <div className="rounded-3xl border border-border/80 bg-card p-8 sm:p-12 shadow-sm">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
              Why ScaleSmart Academy?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Traditional courses teach you where the buttons are located in the
              advertising console. ScaleSmart Academy trains you to behave like
              an operational director managing live capital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-muted/40 border border-border/60">
              <h3 className="text-base font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                <span>Standard Course Platforms</span>
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>
                    Focuses purely on textbook definitions and console
                    navigation.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>
                    Treats metrics (like ACoS) as static instructions rather
                    than symptoms.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>
                    Zero exposure to high-pressure scenarios (hijacks,
                    stockouts, bleeders).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>
                    Assumes limitless budgets and perfect conversion rates.
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-foreground">
              <h3 className="text-base font-bold text-amber-600 dark:text-amber-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>The ScaleSmart Operator Standard</span>
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-foreground/90 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Official concepts paired with practical, battle-tested
                    interpretation.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    The 7-Step Diagnostic framework: Observe → Segment → Isolate
                    → Act.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Inventory-aware advertising math (suppress ads below 21 days
                    supply).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Real portfolio simulation on 200+ ASIN accounts and blended
                    TACoS management.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Academy FAQ Section */}
      <AcademyFaqSection />
    </div>
  );
}

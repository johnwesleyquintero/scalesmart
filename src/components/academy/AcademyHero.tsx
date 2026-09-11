import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Award,
  Compass,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface AcademyHeroProps {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  showBadges?: boolean;
}

export default function AcademyHero({
  title = 'ScaleSmart Academy',
  subtitle = 'Learn Amazon & E-commerce Operations from real-world systems, battle-tested scenarios, and operator thinking.',
  eyebrow = 'Official Concepts + Operator Judgment',
  primaryCtaText = 'Explore Certifications',
  primaryCtaHref = '/academy/certifications',
  secondaryCtaText = 'Start Learning',
  secondaryCtaHref = '/academy#featured',
  showBadges = true,
}: AcademyHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-orange-950/20 border border-orange-100 dark:border-orange-900/30 shadow-lg my-6">
      {/* Amazon-style subtle pattern background */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[linear-gradient(45deg,#ff9900_25%,transparent_25%,transparent_75%,#ff9900_75%,#ff9900),linear-gradient(45deg,#ff9900_25%,transparent_25%,transparent_75%,#ff9900_75%,#ff9900)] bg-[size:20px_20px] bg-[position:0_0,10px_10px]" />
      
      <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20 max-w-6xl mx-auto">
        {/* Top section with eyebrow and title - Amazon clean style */}
        <div className="text-center mb-10">
          {/* Eyebrow badge - Amazon style pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 dark:bg-orange-900/40 px-4 py-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300 mb-5 border border-orange-200 dark:border-orange-800">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            <span>{eyebrow}</span>
          </div>

          {/* Hero Title - Bold, clean typography like Amazon */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
            {title}
          </h1>

          {/* Hero Subtitle - Clear and readable */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* CTA Buttons - Amazon-style buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <Button
            asChild
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm px-6 py-5 text-sm sm:text-base rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <Link href={primaryCtaHref}>
              {primaryCtaText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium px-6 py-5 text-sm sm:text-base rounded-lg transition-all duration-200"
          >
            <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
          </Button>
        </div>

        {/* Trust & Quality Indicators - Clean card layout */}
        {showBadges && (
          <div className="pt-8 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Amazon Aligned
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Mirrors official Amazon Ads Academy standards and
                  certification curriculum.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Coach Wesley Operator Layer
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Translates definitions into tactical execution, diagnostic
                  trees, and live playbooks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Scenario Lab Diagnostics
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Test your real-world instincts against 200+ ASIN inventory and
                  spend anomalies.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

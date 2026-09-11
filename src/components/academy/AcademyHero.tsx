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
    <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl border border-slate-800 my-6">
      {/* Background ambient lighting and grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-500/20 via-slate-900/40 to-slate-950/90 pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-24 max-w-5xl mx-auto text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-medium text-amber-400 mb-6 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>{eyebrow}</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
          {title}
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          {subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Button
            asChild
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-lg shadow-amber-500/25 px-7 py-6 text-base rounded-xl transition-all duration-200 hover:scale-[1.02]"
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
            className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-white font-medium px-7 py-6 text-base rounded-xl backdrop-blur-sm transition-all duration-200 hover:border-slate-600"
          >
            <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
          </Button>
        </div>

        {/* Trust & Quality Indicators */}
        {showBadges && (
          <div className="pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Amazon Aligned
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mirrors official Amazon Ads Academy standards and
                  certification curriculum.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Coach Wesley Operator Layer
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Translates definitions into tactical execution, diagnostic
                  trees, and live playbooks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Scenario Lab Diagnostics
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
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

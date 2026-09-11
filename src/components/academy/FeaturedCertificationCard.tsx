import React from 'react';
import Link from 'next/link';
import { Certification, CREDENTIAL_TRACKS } from '@/types/academy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, Clock, Sparkles, Award } from 'lucide-react';

interface FeaturedCertificationCardProps {
  certification: Certification;
}

export default function FeaturedCertificationCard({
  certification,
}: FeaturedCertificationCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300 mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Visual / Left Banner */}
        <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-[340px] bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-slate-900/40 p-8 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-border/60">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Tag */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Award className="h-3.5 w-3.5" />
              Featured Credential
            </span>
          </div>

          {/* Center Graphic / Typography representation */}
          <div className="relative z-10 my-auto py-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
              Level: {certification.level}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {certification.title}
            </div>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              Official reference curriculum translated into operator mastery.
            </p>
          </div>

          {/* Bottom Pills */}
          <div className="relative z-10 flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-amber-500" />
              {certification.modulesCount} Modules
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              {certification.duration}
            </span>
          </div>
        </div>

        {/* Details / Right Body */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                Certification
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground uppercase font-medium">
                {certification.track === CREDENTIAL_TRACKS.AMAZON_ALIGNED
                  ? 'Amazon Aligned'
                  : 'ScaleSmart Credential'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
              {certification.title}
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
              {certification.description}
            </p>

            {/* Core learning topics preview */}
            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                Core competencies covered:
              </div>
              <div className="flex flex-wrap gap-2">
                {certification.topics.slice(0, 4).map((topic, i) => (
                  <span
                    key={i}
                    className="inline-block px-3 py-1 rounded-lg bg-muted text-foreground/90 text-xs font-medium border border-border/50"
                  >
                    ✓ {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Operator note highlight */}
            {certification.operatorFocus && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-foreground/90 font-medium mb-6 flex items-start gap-2.5">
                <span className="text-amber-500 font-bold shrink-0">💡</span>
                <span>{certification.operatorFocus}</span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>{certification.modulesCount} Modules</span>
              <span>•</span>
              <span>{certification.assessmentsCount} Assessment</span>
              <span>•</span>
              <span>{certification.duration}</span>
            </div>

            <Button
              asChild
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all hover:scale-[1.02]"
            >
              <Link href={`/academy/certifications#${certification.slug}`}>
                Start Certification
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { Certification } from '@/types/academy';
import { ArrowRight, Award, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CertificationCardProps {
  certification: Certification;
  className?: string;
}

export default function CertificationCard({
  certification,
  className,
}: CertificationCardProps) {
  const isOperatorCredential = certification.track === 'operator-credential';

  return (
    <div
      id={certification.slug}
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm transition-all duration-200 hover:shadow-md hover:border-amber-500/50 hover:translate-y-[-2px]',
        isOperatorCredential &&
          'ring-1 ring-amber-500/30 bg-gradient-to-b from-card to-amber-500/5',
        className,
      )}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs',
                isOperatorCredential
                  ? 'bg-amber-500'
                  : 'bg-slate-900 dark:bg-slate-700',
              )}
            >
              <Award className="h-4 w-4 text-white" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {isOperatorCredential ? 'ScaleSmart Credential' : 'Certification'}
            </span>
          </div>

          <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
            {certification.level}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-amber-500 transition-colors duration-150 mb-3">
          {certification.title}
        </h3>

        {/* Short Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          {certification.shortDescription}
        </p>

        {/* Topics preview */}
        <div className="space-y-1.5 mb-6">
          {certification.topics.slice(0, 3).map((topic, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{topic}</span>
            </div>
          ))}
        </div>

        {/* Operator Note if available */}
        {certification.operatorFocus && (
          <div className="mb-6 p-2.5 rounded-lg bg-muted/70 border border-border/50 text-xs text-muted-foreground italic">
            {certification.operatorFocus}
          </div>
        )}
      </div>

      {/* Footer Meta & Action */}
      <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>{certification.assessmentsCount} Assessment</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {certification.duration}
          </span>
        </div>

        <Link
          href={`/academy/certifications#${certification.slug}`}
          aria-label={`Start ${certification.title}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-bold transition-transform duration-200 group-hover:scale-110 group-hover:bg-amber-400"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

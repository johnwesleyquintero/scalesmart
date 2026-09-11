import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass, Sparkles, Target, Zap, ArrowRight } from 'lucide-react';

export default function OperatorCallout() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-8 sm:p-12 border border-amber-500/30 shadow-2xl my-12">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400 mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          The Coach Wesley Operator Layer
        </div>

        <blockquote className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4 leading-snug">
          “Amazon gives you the tools. Knowing when to use them is the job.”
        </blockquote>

        <p className="text-sm sm:text-base text-slate-300 mb-8 leading-relaxed max-w-3xl">
          Most certification courses stop at definitions: what Sponsored
          Products is, how a bid works, what ACoS means. ScaleSmart Academy
          teaches operational judgment: What do you do when TACoS spikes from
          28% to 46% on a 200-ASIN catalog? How do you adjust bids when
          inventory falls under 21 days? How do you prevent auto campaigns from
          cannibalizing organic rank?
        </p>

        {/* 4-Pillar Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1.5">
              <Target className="h-4 w-4" />
              <span>Official Concepts</span>
            </div>
            <p className="text-xs text-slate-300">
              Clear taxonomy, ad formats, and policy parameters aligned with
              Amazon Ads Academy.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs mb-1.5">
              <Zap className="h-4 w-4" />
              <span>Operator Interpretation</span>
            </div>
            <p className="text-xs text-slate-300">
              Dissecting the math, margin thresholds, placement multipliers, and
              bid ceilings.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1.5">
              <Compass className="h-4 w-4" />
              <span>Real-World Scenarios</span>
            </div>
            <p className="text-xs text-slate-300">
              Observe → Segment → Isolate → Act frameworks applied to live
              account anomalies.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs mb-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Practical Exercises</span>
            </div>
            <p className="text-xs text-slate-300">
              Scenario drills that evaluate operational decisions before
              touching real advertising capital.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-4">
          <Button
            asChild
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl px-6 py-2.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <Link href="/academy/certifications">
              Explore Operator Certifications
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <span className="text-xs text-slate-400 font-medium">
            Available on-demand with zero account requirement.
          </span>
        </div>
      </div>
    </div>
  );
}

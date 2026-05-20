'use client';

import { Badge } from '@/components/ui/badge';
import {
  Search,
  Settings2,
  UserCheck,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { LANDING } from '@/constants/marketing';

const steps = LANDING.HOW_IT_WORKS.steps.map((step, i) => {
  const icons = [
    <Search key={0} className="h-6 w-6 text-blue-600" />,
    <Settings2 key={1} className="h-6 w-6 text-blue-600" />,
    <UserCheck key={2} className="h-6 w-6 text-blue-600" />,
    <TrendingUp key={3} className="h-6 w-6 text-blue-600" />,
  ];
  return { ...step, icon: icons[i] };
});

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="container relative mx-auto px-4 py-24 md:py-32 scroll-mt-20"
    >
      <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <Badge variant="secondary" className="mb-4">
            {LANDING.HOW_IT_WORKS.badge}
          </Badge>
          <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {LANDING.HOW_IT_WORKS.headerPart1}
            <span className="text-blue-600">
              {LANDING.HOW_IT_WORKS.headerPart2}
            </span>
          </h2>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
            <p>{LANDING.HOW_IT_WORKS.paragraphs[0]}</p>
            <p>{LANDING.HOW_IT_WORKS.paragraphs[1]}</p>
            <p className="font-medium text-foreground">
              {LANDING.HOW_IT_WORKS.paragraphs[2]}
            </p>
          </div>
          <div className="mt-10">
            <Button size="lg" className="rounded-xl px-8 group" asChild>
              <Link href="/contact">
                {LANDING.HOW_IT_WORKS.primaryCta}{' '}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-200 to-transparent dark:via-blue-800" />

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative pl-8 group">
                {/* Connector Dot */}
                <div className="absolute left-[-21px] top-0 h-10 w-10 rounded-full border-4 border-background bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center transition-transform group-hover:scale-110">
                  <span className="text-xs font-bold text-blue-600">
                    {step.number}
                  </span>
                </div>

                <div className="p-6 rounded-3xl border bg-card/50 shadow-sm transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
                  <div className="mb-4 inline-block rounded-xl bg-blue-50 dark:bg-blue-900/20 p-2">
                    {step.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

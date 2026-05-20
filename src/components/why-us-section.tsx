'use client';

import { Badge } from '@/components/ui/badge';
import { Zap, Users, ShieldCheck, Cpu, BarChart3, Clock } from 'lucide-react';
import { LANDING } from '@/constants/marketing';

const reasons = LANDING.WHY_US.reasons.map((reason, i) => {
  const icons = [
    <Cpu key={0} className="h-6 w-6 text-blue-600" />,
    <Users key={1} className="h-6 w-6 text-indigo-600" />,
    <Zap key={2} className="h-6 w-6 text-emerald-600" />,
    <BarChart3 key={3} className="h-6 w-6 text-amber-600" />,
    <ShieldCheck key={4} className="h-6 w-6 text-pink-600" />,
    <Clock key={5} className="h-6 w-6 text-sky-600" />,
  ];
  const colors = [
    'bg-blue-100 dark:bg-blue-900/30',
    'bg-indigo-100 dark:bg-indigo-900/30',
    'bg-emerald-100 dark:bg-emerald-900/30',
    'bg-amber-100 dark:bg-amber-900/30',
    'bg-pink-100 dark:bg-pink-900/30',
    'bg-sky-100 dark:bg-sky-900/30',
  ];
  return { ...reason, icon: icons[i], color: colors[i] };
});

export default function WhyUsSection() {
  return (
    <section className="container relative mx-auto px-4 py-32 overflow-hidden">
      <div className="mb-16 text-center">
        <Badge variant="secondary" className="mb-4">
          {LANDING.WHY_US.badge}
        </Badge>
        <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {LANDING.WHY_US.headerPart1}
          <span className="text-blue-600">{LANDING.WHY_US.headerPart2}</span>
        </h2>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed">
          {LANDING.WHY_US.subhead}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {reasons.map((reason, index) => (
          <div
            key={reason.title}
            className="group relative overflow-hidden rounded-3xl border bg-card/50 p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div
              className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${reason.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}
            >
              {reason.icon}
            </div>
            <h3 className="mb-3 text-xl font-bold">{reason.title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {reason.description}
            </p>

            {/* Subtle bottom accent line */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
          </div>
        ))}
      </div>

      <div className="mt-20 flex flex-col items-center justify-center text-center">
        <div className="p-8 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 max-w-3xl">
          <p className="text-lg font-medium italic text-blue-800 dark:text-blue-300">
            {LANDING.WHY_US.quote}
          </p>
          <p className="mt-4 text-sm font-bold uppercase tracking-widest text-blue-600">
            {LANDING.WHY_US.author}
          </p>
        </div>
      </div>
    </section>
  );
}

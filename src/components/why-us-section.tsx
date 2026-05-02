'use client';

import { Badge } from '@/components/ui/badge';
import { Zap, Users, ShieldCheck, Cpu, BarChart3, Clock } from 'lucide-react';

const reasons = [
  {
    title: 'Systems-First Approach',
    description:
      'We don’t just delegate tasks; we design the systems that make those tasks repeatable and efficient.',
    icon: <Cpu className="h-6 w-6 text-blue-600" />,
    color: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    title: 'Trained & Vetted VAs',
    description:
      'Our team undergoes continuous training in high-level operations, ensuring they deliver quality from day one.',
    icon: <Users className="h-6 w-6 text-indigo-600" />,
    color: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  {
    title: 'Automation Integration',
    description:
      'We blend human talent with modern AI and automation tools to reduce manual load and speed up execution.',
    icon: <Zap className="h-6 w-6 text-emerald-600" />,
    color: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    title: 'Operational Transparency',
    description:
      'Get real-time visibility into your business metrics and team performance through our structured reporting.',
    icon: <BarChart3 className="h-6 w-6 text-amber-600" />,
    color: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    title: 'Secure & Reliable',
    description:
      'Your data and processes are handled with strict professional care and industry-standard security protocols.',
    icon: <ShieldCheck className="h-6 w-6 text-pink-600" />,
    color: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    title: 'Time-Back Guarantee',
    description:
      'Our goal is simple: to give you back at least 10+ hours a week so you can focus on high-value growth.',
    icon: <Clock className="h-6 w-6 text-sky-600" />,
    color: 'bg-sky-100 dark:bg-sky-900/30',
  },
];

export default function WhyUsSection() {
  return (
    <section className="container relative mx-auto px-4 py-32 overflow-hidden">
      <div className="mb-16 text-center">
        <Badge variant="secondary" className="mb-4">
          THE SCALESMART DIFFERENCE
        </Badge>
        <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Why Choose <span className="text-blue-600">ScaleSmart?</span>
        </h2>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed">
          We are more than an agency. We are your operational partners,
          dedicated to building the systems that make your growth inevitable.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {reasons.map((reason, index) => (
          <div
            key={reason.title}
            className="group relative overflow-hidden rounded-3xl border bg-background/50 p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
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
            "ScaleSmart didn't just give me a virtual assistant; they gave me a
            business that runs itself. The systems they built are the foundation
            of my success."
          </p>
          <p className="mt-4 text-sm font-bold uppercase tracking-widest text-blue-600">
            — Elite E-commerce Client
          </p>
        </div>
      </div>
    </section>
  );
}

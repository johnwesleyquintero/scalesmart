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

const steps = [
  {
    number: '01',
    title: 'Discovery & Audit',
    description:
      'We deep-dive into your current operations to identify bottlenecks and manual leaks that are slowing you down.',
    icon: <Search className="h-6 w-6 text-blue-600" />,
  },
  {
    number: '02',
    title: 'Systems Design',
    description:
      'We architect your custom operational tech stack and workflows designed specifically for your business goals.',
    icon: <Settings2 className="h-6 w-6 text-blue-600" />,
  },
  {
    number: '03',
    title: 'Deployment & Placement',
    description:
      'We implement the systems and place highly-trained VAs to run them, ensuring a seamless transition.',
    icon: <UserCheck className="h-6 w-6 text-blue-600" />,
  },
  {
    number: '04',
    title: 'Optimization & Scale',
    description:
      'We continuously monitor performance and optimize your workflows to ensure long-term, chaos-free growth.',
    icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="container relative mx-auto px-4 py-24 md:py-32 scroll-mt-20"
    >
      <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <Badge variant="secondary" className="mb-4">
            OUR WAY
          </Badge>
          <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            How ScaleSmart <span className="text-blue-600">Works.</span>
          </h2>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
            <p>
              ScaleSmart is a full-service virtual support firm. This means that
              we are fully engaged in much of our clients’ daily tasks necessary
              to operate their businesses efficiently and effectively.
            </p>
            <p>
              As we handle the administrative tasks and systems, our clients are
              able to focus on generating revenue and high-level strategy for
              their businesses.
            </p>
            <p className="font-medium text-foreground">
              Are you interested in working with us? Get your schedule back on
              track and take your life back.
            </p>
          </div>
          <div className="mt-10">
            <Button size="lg" className="rounded-xl px-8 group" asChild>
              <Link href="/contact">
                Contact us today{' '}
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

                <div className="p-6 rounded-3xl border bg-background/50 shadow-sm transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
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

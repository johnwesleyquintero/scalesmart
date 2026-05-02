'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Rocket,
  Settings,
  Search,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Target,
  BarChart,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function OperationsGrowthPage() {
  const detailedServices = [
    {
      title: 'Operations & Systems Design',
      description:
        'We audit your current messy operations and build a custom, scalable tech stack. We don’t just suggest tools; we implement the architecture.',
      features: [
        'Workflow Mapping',
        'Tool Stack Integration',
        'SOP Development',
        'KPI Dashboards',
      ],
      icon: <Settings className="h-8 w-8 text-blue-500" />,
    },
    {
      title: 'Lead Generation Systems',
      description:
        'Stop relying on luck. We build automated outbound and inbound pipelines that consistently fill your calendar with qualified leads.',
      features: [
        'Automated Outreach',
        'CRM Management',
        'Lead Scoring',
        'Email Deliverability',
      ],
      icon: <Search className="h-8 w-8 text-blue-500" />,
    },
    {
      title: 'E-commerce Operations',
      description:
        'Specialized management for Amazon (FBA/FBM) and Shopify stores. We handle the operational load so you can focus on product and brand.',
      features: [
        'Listing Optimization',
        'Inventory Planning',
        'Store Health Monitoring',
        'Supply Chain Support',
      ],
      icon: <Rocket className="h-8 w-8 text-orange-500" />,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-24 md:py-32">
      <div className="mb-20">
        <Link
          href="/services"
          className="text-sm font-medium text-blue-600 hover:underline mb-8 block"
        >
          ← Back to All Services
        </Link>
        <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          CORE INFRASTRUCTURE
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
          Operations & <span className="text-blue-600">Growth Systems.</span>
        </h1>
        <p className="max-w-3xl text-xl text-muted-foreground leading-relaxed">
          The foundation of scale isn't more people—it's better systems. We
          build the operational backbone and growth pipelines that allow your
          business to run without you.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-3 mb-32">
        {detailedServices.map((service) => (
          <div
            key={service.title}
            className="rounded-3xl border bg-background/50 p-8 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="mb-6 inline-block rounded-2xl bg-muted/30 p-4">
              {service.icon}
            </div>
            <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {service.description}
            </p>
            <ul className="space-y-3">
              {service.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mb-32">
        <div>
          <h2 className="text-3xl font-bold mb-6">
            The Goal: Exit-Ready Operations
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Messy operations decrease your business value and increase your
            stress. By systemizing your growth and delivery, you create a
            business that is measurable, predictable, and ultimately sellable.
          </p>
          <div className="grid gap-6 md:grid-cols-2 mb-12">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Clarity</h4>
                <p className="text-sm text-muted-foreground">
                  Every task has a home and every person has a process.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <BarChart className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Metrics</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time visibility into your growth and operational
                  efficiency.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative rounded-3xl border overflow-hidden aspect-video md:aspect-[21/9] bg-muted/20 group cursor-zoom-in">
          {/* Placeholder for system diagram or client result screenshot */}
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium italic">
            <Image
              src="/images/agency-assets/images/Systems Architecture Visualization.png"
              alt="Systems Architecture Visualization"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              fill
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-blue-600 p-8 md:p-16 text-center text-white shadow-2xl">
        <h2 className="text-3xl font-bold md:text-5xl mb-6">
          Build Your Scale Engine
        </h2>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Ready to transition from a messy operator to a visionary owner? Let's
          build your growth system.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="h-14 px-10 text-lg font-bold rounded-xl"
          asChild
        >
          <Link href="/contact">
            Book Strategy Session <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

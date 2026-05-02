'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Headphones,
  Share2,
  LayoutGrid,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

export default function BrandSupportPage() {
  const detailedServices = [
    {
      title: 'Customer Support Systems',
      description:
        'Your customers deserve fast, clear, and empathetic support. We build the helpdesks and training systems that keep your clients happy and loyal.',
      features: [
        'Helpdesk Setup (Zendesk/Gorgias)',
        'Response Templates',
        'Quality QA Workflows',
        '24/7 Support Design',
      ],
      icon: <Headphones className="h-8 w-8 text-pink-500" />,
    },
    {
      title: 'Content & Social Support',
      description:
        'Stay visible without the burnout. We build systems for content scheduling, engagement, and brand consistency across all digital channels.',
      features: [
        'Content Calendars',
        'Engagement Systems',
        'Posting Workflows',
        'Platform Management',
      ],
      icon: <Share2 className="h-8 w-8 text-sky-500" />,
    },
    {
      title: 'Custom Operational Systems',
      description:
        'Every business is unique. We design custom solutions for special projects, event management, and internal operational tools.',
      features: [
        'Special Project Systems',
        'Internal Tool Design',
        'Event Operations',
        'Tailored Logic',
      ],
      icon: <LayoutGrid className="h-8 w-8 text-amber-500" />,
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
        <Badge className="mb-4 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
          REPUTATION & TRUST
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
          Brand & <span className="text-pink-600">Support Systems.</span>
        </h1>
        <p className="max-w-3xl text-xl text-muted-foreground leading-relaxed">
          Maintain your reputation while you focus on the big picture. We build
          the support and visibility systems that keep your brand active and
          your customers delighted.
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
                  <CheckCircle2 className="h-4 w-4 text-pink-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid gap-16 lg:grid-cols-2 lg:items-center mb-32">
        <div>
          <h2 className="text-3xl font-bold mb-6">Delight at Scale</h2>
          <p className="text-lg text-muted-foreground mb-8">
            As you grow, customer experience often suffers. Our systems ensure
            that every customer feels heard and every brand touchpoint is
            consistent.
          </p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Customer Loyalty</h4>
                <p className="text-sm text-muted-foreground">
                  Faster response times lead to higher retention and better
                  reviews.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Brand Safety</h4>
                <p className="text-sm text-muted-foreground">
                  Consistent messaging across all platforms, handled by
                  structured flows.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative rounded-3xl border overflow-hidden aspect-video bg-muted/20">
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium italic text-center px-8">
            [ Support Workflow Visualization ]
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-pink-600 p-8 md:p-16 text-center text-white shadow-2xl">
        <h2 className="text-3xl font-bold md:text-5xl mb-6">
          Delight Your Customers
        </h2>
        <p className="text-xl text-pink-100 mb-10 max-w-2xl mx-auto">
          Don't let your growth hurt your reputation. Let's systemize your brand
          support.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="h-14 px-10 text-lg font-bold rounded-xl"
          asChild
        >
          <Link href="/contact">
            Improve Your Support <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

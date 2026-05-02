'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Zap,
  FileText,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Workflow,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

export default function WorkforceWorkflowsPage() {
  const detailedServices = [
    {
      title: 'Virtual Assistant Systems',
      description:
        'We don’t just hire VAs—we build the infrastructure to manage them. From task delegation to accountability, we ensure your team produces results.',
      features: [
        'VA Onboarding Portals',
        'Performance Tracking',
        'Daily Reporting Systems',
        'Task Management Sets',
      ],
      icon: <Users className="h-8 w-8 text-blue-500" />,
    },
    {
      title: 'Intelligent Automation',
      description:
        'Replace manual labor with smart tech. We connect your apps into a seamless, hands-off machine that handles the repetitive work for you.',
      features: [
        'API Integrations',
        'Custom Zapier/Make Flows',
        'Email Automations',
        'Data Syncing',
      ],
      icon: <Zap className="h-8 w-8 text-emerald-500" />,
    },
    {
      title: 'Administrative Systems',
      description:
        'High-level back-office coordination. We design the "brain" of your business so that administration never slows down your growth.',
      features: [
        'Meeting Management',
        'Calendar Optimization',
        'File Organization',
        'Internal Comms Design',
      ],
      icon: <FileText className="h-8 w-8 text-slate-500" />,
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
        <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          EFFICIENCY & SCALE
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
          Workforce & <span className="text-emerald-600">Workflows.</span>
        </h1>
        <p className="max-w-3xl text-xl text-muted-foreground leading-relaxed">
          Unlock your time by delegating to structured systems. We build the
          workflows and manage the workforce so you can stay in your zone of
          genius.
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

      <div className="grid gap-16 lg:grid-cols-2 lg:items-center mb-32">
        <div>
          <h2 className="text-3xl font-bold mb-6">
            Humans + Automation = Scale
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            The most successful businesses combine talented people with powerful
            automation. We build the bridge between your team and your
            technology.
          </p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Workflow className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Seamless Flows</h4>
                <p className="text-sm text-muted-foreground">
                  Information moves through your business without getting stuck.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">Rapid Onboarding</h4>
                <p className="text-sm text-muted-foreground">
                  Get new team members up to speed in days, not months.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative rounded-3xl border overflow-hidden aspect-video bg-muted/20">
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium italic text-center px-8">
            [ Workflow Automation Visualization ]
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-emerald-600 p-8 md:p-16 text-center text-white shadow-2xl">
        <h2 className="text-3xl font-bold md:text-5xl mb-6">
          Automate Your Delegation
        </h2>
        <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
          Stop being the bottleneck in your own business. Let's systemize your
          workforce.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="h-14 px-10 text-lg font-bold rounded-xl"
          asChild
        >
          <Link href="/contact">
            Build Your Workflow <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

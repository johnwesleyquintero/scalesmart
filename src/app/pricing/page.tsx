import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  Users,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const features = [
    {
      title: 'System-Driven Execution',
      description:
        'Every task is handled within a structured workflow—ensuring consistency, clarity, and accountability.',
      icon: <Zap className="h-6 w-6 text-purple-500" />,
    },
    {
      title: 'Trained Virtual Assistants',
      description:
        'Our VAs are continuously trained to improve efficiency, accuracy, and quality of work across different business functions.',
      icon: <Users className="h-6 w-6 text-blue-500" />,
    },
    {
      title: 'Ongoing Support & Optimization',
      description:
        'We don’t just assign and forget. We monitor, refine, and improve workflows to keep your operations running smoothly.',
      icon: <TrendingUp className="h-6 w-6 text-emerald-500" />,
    },
    {
      title: 'Secure & Reliable Operations',
      description:
        'Your data, processes, and business information are handled with strict confidentiality and professional care.',
      icon: <ShieldCheck className="h-6 w-6 text-indigo-500" />,
    },
    {
      title: 'Clear Communication Channels',
      description:
        'Stay aligned through organized communication—no confusion, no delays, just execution.',
      icon: <MessageSquare className="h-6 w-6 text-pink-500" />,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-24 md:py-32">
      <div className="mb-20 text-center">
        <Badge
          variant="secondary"
          className="mb-4 py-1.5 px-4 text-sm font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
        >
          PRICING
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Flexible Support.{' '}
          <span className="text-purple-600">Structured Execution.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed">
          ScaleSmart offers flexible hourly support backed by structured systems
          and workflows designed for real business growth.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-purple-500/10 to-blue-500/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border bg-background/80 p-8 shadow-2xl backdrop-blur-md md:p-12">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Standard Support</h3>
                <p className="text-muted-foreground">
                  Perfect for scaling operators
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-purple-600 uppercase tracking-widest">
                  STARTING AT
                </div>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-5xl font-extrabold">$7</span>
                  <span className="text-xl text-muted-foreground">/hr</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-lg font-medium text-foreground italic">
                "Simple pricing. Serious output."
              </p>
              <p className="text-muted-foreground">
                Get access to trained virtual assistants supported by systems,
                processes, and continuous improvement—not just random task
                execution.
              </p>
              <Button
                className="w-full h-14 text-lg font-bold rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
                asChild
              >
                <Link href="/contact">Get Started Today</Link>
              </Button>
            </div>

            <div className="mt-8 border-t pt-8">
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <Clock className="h-4 w-4 text-purple-500" />
                Flexible hours to fit your workflow
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-3xl font-bold">What You Get</h2>
          <div className="grid gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-4 rounded-2xl border bg-background/50 hover:bg-background transition-colors shadow-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-24 rounded-3xl border bg-muted/30 p-8 md:p-16 text-center">
        <h3 className="mb-6 text-2xl font-bold md:text-3xl">
          Built for Operators Who Value Results
        </h3>
        <p className="mx-auto mb-10 max-w-3xl text-lg text-muted-foreground">
          Whether you&apos;re managing daily operations, scaling your store, or
          building systems—ScaleSmart gives you the execution layer you need
          without the chaos.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="h-14 px-10 text-lg font-bold rounded-xl group"
          asChild
        >
          <Link href="/contact" className="flex items-center gap-2">
            Build Your System{' '}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

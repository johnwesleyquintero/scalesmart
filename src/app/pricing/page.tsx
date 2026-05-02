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
      icon: <Zap className="h-6 w-6 text-blue-500" />,
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
      icon: <ShieldCheck className="h-6 w-6 text-blue-500" />,
    },
    {
      title: 'Clear Communication Channels',
      description:
        'Stay aligned through organized communication—no confusion, no delays, just execution.',
      icon: <MessageSquare className="h-6 w-6 text-pink-500" />,
    },
  ];

  return (
    <main className="container mx-auto px-4 py-24 md:py-32">
      <div className="mb-20 text-center">
        <Badge variant="secondary" className="mb-4">
          PRICING
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Flexible Support.{' '}
          <span className="text-blue-600">Structured Execution.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed">
          ScaleSmart offers flexible hourly support backed by structured systems
          and workflows designed for real business growth.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <section className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border bg-background/80 p-8 shadow-2xl backdrop-blur-md md:p-12">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Standard Support</h3>
                <p className="text-muted-foreground">
                  Perfect for scaling operators
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-600 uppercase tracking-widest">
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
                asChild
                className="w-full h-14 text-lg font-bold rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              >
                <Link href="/contact" className="flex items-center gap-2">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Billed weekly based on actual
                usage.
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight">
            What’s Included in Our{' '}
            <span className="text-blue-600">Standard Support?</span>
          </h2>
          <div className="grid gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex gap-6 rounded-2xl border bg-background/50 p-6 transition-all hover:bg-background"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 transition-transform group-hover:scale-110 group-hover:rotate-3">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="mb-1 font-bold text-lg">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-32 rounded-[3rem] border bg-background/50 p-8 md:p-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
              Scale With <span className="text-blue-600">Confidence.</span>
            </h2>
            <div className="space-y-4">
              {[
                'No long-term lock-in contracts.',
                'Pay for exactly what you need.',
                'Dedicated support systems.',
                'Continuous workflow optimization.',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <span className="text-lg font-medium text-muted-foreground">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
            <p className="text-lg font-medium italic text-blue-800 dark:text-blue-300">
              "We focus on the systems so you can focus on the growth. Our
              pricing is built to scale alongside your business."
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-8 rounded-full h-12 px-8 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
            >
              <Link href="/contact">Ask About Custom Plans</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

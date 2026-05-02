import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Rocket,
  Settings,
  Users,
  Zap,
  Search,
  BarChart3,
  Headphones,
  FileText,
  Share2,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ServicesPage() {
  const services = [
    {
      id: 'ops-systems',
      title: 'Operations & Systems Design',
      tagline: 'Build clarity. Eliminate chaos.',
      description:
        'We design and implement structured workflows that turn messy operations into clean, repeatable systems. From task management to internal processes, we help you operate with speed, visibility, and control.',
      icon: <Settings className="h-8 w-8 text-purple-500" />,
      gradient: 'from-purple-500/10 to-blue-500/10',
    },
    {
      id: 'va-systems',
      title: 'Virtual Assistant Systems',
      tagline: 'Delegate with structure, not guesswork.',
      description:
        'We don’t just provide VAs—we build the system around them. From onboarding to workflow design and task execution, we ensure your team runs efficiently and delivers consistent results.',
      icon: <Users className="h-8 w-8 text-blue-500" />,
      gradient: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      id: 'automation-workflow',
      title: 'Automation & Workflow Integration',
      tagline: 'Work less manually. Scale more intelligently.',
      description:
        'We automate repetitive tasks and connect your tools into one streamlined system. From notifications to task triggers and backend processes, we reduce friction and increase execution speed.',
      icon: <Zap className="h-8 w-8 text-emerald-500" />,
      gradient: 'from-emerald-500/10 to-teal-500/10',
    },
    {
      id: 'ecom-ops',
      title: 'E-commerce & Amazon Operations',
      tagline: 'Optimize, manage, and scale your store.',
      description:
        'From product listings and catalog management to store health and customer handling, we support end-to-end e-commerce operations built for long-term growth.',
      icon: <Rocket className="h-8 w-8 text-orange-500" />,
      gradient: 'from-orange-500/10 to-red-500/10',
    },
    {
      id: 'lead-gen',
      title: 'Lead Generation & Outreach Systems',
      tagline: 'Build predictable pipelines.',
      description:
        'We implement systems that consistently generate and manage leads using modern tools, structured workflows, and trained support—so your growth doesn’t rely on guesswork.',
      icon: <Search className="h-8 w-8 text-indigo-500" />,
      gradient: 'from-indigo-500/10 to-purple-500/10',
    },
    {
      id: 'customer-support',
      title: 'Customer Support Systems',
      tagline: 'Fast, organized, and reliable support.',
      description:
        'We build support workflows that ensure every customer interaction is handled with clarity and efficiency—across email, chat, and platform messaging.',
      icon: <Headphones className="h-8 w-8 text-pink-500" />,
      gradient: 'from-pink-500/10 to-rose-500/10',
    },
    {
      id: 'admin-support',
      title: 'Administrative & Back Office Support',
      tagline: 'Free your time for high-value work.',
      description:
        'From data management to scheduling and internal coordination, we handle the operational load so you can focus on growth and strategy.',
      icon: <FileText className="h-8 w-8 text-slate-500" />,
      gradient: 'from-slate-500/10 to-gray-500/10',
    },
    {
      id: 'social-content',
      title: 'Social Media & Content Support',
      tagline: 'Stay visible. Stay consistent.',
      description:
        'We help manage and execute your content workflows—from posting and engagement to basic optimization—so your brand stays active and relevant.',
      icon: <Share2 className="h-8 w-8 text-sky-500" />,
      gradient: 'from-sky-500/10 to-blue-500/10',
    },
    {
      id: 'custom-solutions',
      title: 'Custom Solutions',
      tagline: 'Your business isn’t generic. Neither are we.',
      description:
        'Need something outside the list? We design tailored systems and solutions based on your operations, tools, and growth goals.',
      icon: <LayoutGrid className="h-8 w-8 text-amber-500" />,
      gradient: 'from-amber-500/10 to-yellow-500/10',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-24 md:py-32">
      <div className="mb-20 max-w-4xl">
        <Badge
          variant="secondary"
          className="mb-4 py-1.5 px-4 text-sm font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
        >
          SERVICES
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
          Digital Solutions That{' '}
          <span className="text-purple-600">Actually Scale.</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          ScaleSmart is built for operators who want more than just help—they
          want{' '}
          <span className="text-foreground font-semibold">
            structure, speed, and scalability.
          </span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.id}
            id={service.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-background/50 p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />
            <div className="relative z-10">
              <div className="mb-6 inline-block rounded-2xl bg-background p-3 shadow-sm border">
                {service.icon}
              </div>
              <h3 className="mb-2 text-2xl font-bold">{service.title}</h3>
              <p className="mb-4 text-sm font-bold text-purple-600 uppercase tracking-wider">
                {service.tagline}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-32 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 p-8 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">
            Your Growth, Systemized
          </h2>
          <p className="mb-10 text-xl text-purple-100">
            ScaleSmart is built for operators who want more than just help—they
            want structure, speed, and scalability.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="h-14 px-8 text-lg font-bold rounded-xl"
              asChild
            >
              <Link href="/contact" className="flex items-center gap-2">
                Book a Strategy Call <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-bold rounded-xl bg-transparent text-white border-white hover:bg-white/10"
              asChild
            >
              <Link href="/about">Our Philosophy</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

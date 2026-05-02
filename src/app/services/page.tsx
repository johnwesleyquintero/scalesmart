import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Rocket,
  Settings,
  Users,
  Zap,
  Search,
  Headphones,
  FileText,
  Share2,
  LayoutGrid,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ServicesPage() {
  const serviceCategories = [
    {
      title: 'Operations & Growth Systems',
      id: 'ops-growth',
      href: '/services/operations-growth',
      description: 'Infrastructure and pipelines designed for massive scale.',
      services: [
        {
          id: 'ops-systems',
          title: 'Operations & Systems Design',
          tagline: 'Build clarity. Eliminate chaos.',
          description:
            'Custom workflows that turn messy operations into clean, repeatable systems.',
          icon: <Settings className="h-6 w-6 text-blue-500" />,
        },
        {
          id: 'lead-gen',
          title: 'Lead Generation Systems',
          tagline: 'Build predictable pipelines.',
          description:
            'Predictable outbound and inbound lead management systems.',
          icon: <Search className="h-6 w-6 text-blue-500" />,
        },
        {
          id: 'ecom-ops',
          title: 'E-commerce Operations',
          tagline: 'Optimize and scale your store.',
          description:
            'End-to-end management for Amazon and independent stores.',
          icon: <Rocket className="h-6 w-6 text-orange-500" />,
        },
      ],
    },
    {
      title: 'Workforce & Workflow Systems',
      id: 'workforce-workflows',
      href: '/services/workforce-workflows',
      description: 'The engine room of your business, automated and managed.',
      services: [
        {
          id: 'va-systems',
          title: 'Virtual Assistant Systems',
          tagline: 'Delegate with structure.',
          description:
            'Not just VAs—but the systems, onboarding, and tracking around them.',
          icon: <Users className="h-6 w-6 text-blue-500" />,
        },
        {
          id: 'automation-workflow',
          title: 'Intelligent Automation',
          tagline: 'Work less manually.',
          description:
            'Connecting your tech stack into one automated, hands-off machine.',
          icon: <Zap className="h-6 w-6 text-emerald-500" />,
        },
        {
          id: 'admin-support',
          title: 'Administrative Systems',
          tagline: 'Free your time.',
          description:
            'Back-office coordination built for high-value strategic execution.',
          icon: <FileText className="h-6 w-6 text-slate-500" />,
        },
      ],
    },
    {
      title: 'Brand & Support Systems',
      id: 'brand-support',
      href: '/services/brand-support',
      description:
        'Maintain visibility and trust while you focus on the big picture.',
      services: [
        {
          id: 'customer-support',
          title: 'Customer Support Systems',
          tagline: 'Fast and reliable support.',
          description:
            'Scalable support workflows across email, chat, and platforms.',
          icon: <Headphones className="h-6 w-6 text-pink-500" />,
        },
        {
          id: 'social-content',
          title: 'Content Support',
          tagline: 'Stay visible and consistent.',
          description: 'Posting, engagement, and content management workflows.',
          icon: <Share2 className="h-6 w-6 text-sky-500" />,
        },
        {
          id: 'custom-solutions',
          title: 'Custom Systems',
          tagline: 'Your business isn’t generic.',
          description:
            'Tailored solutions based on your unique tools and growth goals.',
          icon: <LayoutGrid className="h-6 w-6 text-amber-500" />,
        },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-24 md:py-32">
      <div className="mb-24 max-w-4xl">
        <Badge
          variant="secondary"
          className="mb-4 py-1.5 px-4 text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        >
          OUR SERVICES
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
          Digital Systems Built{' '}
          <span className="text-blue-600">For Operators.</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          We don't just "do work"—we build the systems that make work
          repeatable, measurable, and scalable. Explore our core operational
          categories.
        </p>
      </div>

      <div className="space-y-32">
        {serviceCategories.map((category) => (
          <section key={category.id} id={category.id} className="scroll-mt-32">
            <div className="mb-12 border-l-4 border-blue-600 pl-6">
              <h2 className="text-3xl font-bold md:text-4xl mb-2">
                {category.title}
              </h2>
              <p className="text-xl text-muted-foreground">
                {category.description}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {category.services.map((service) => (
                <div
                  key={service.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-background/50 p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="relative z-10">
                    <div className="mb-6 inline-block rounded-2xl bg-muted/30 p-3 shadow-sm">
                      {service.icon}
                    </div>
                    <h3 className="mb-2 text-xl font-bold">{service.title}</h3>
                    <p className="mb-4 text-xs font-bold text-blue-600 uppercase tracking-widest">
                      {service.tagline}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                variant="ghost"
                className="group text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                asChild
              >
                <Link href={category.href} className="flex items-center gap-2">
                  Deep Dive into this system{' '}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-32 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">
            Ready to Systemize?
          </h2>
          <p className="mb-10 text-xl text-blue-100">
            Stop working in messy operations. Let's build the foundation your
            business needs to scale.
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
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <main className="container mx-auto px-4 py-24 md:py-32">
      <div className="mb-20 text-center">
        <Badge variant="secondary" className="mb-4">
          OUR EXPERTISE
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Systems designed for <span className="text-blue-600">impact.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          We build the operational infrastructure that allows your business to
          breathe, execute, and scale.
        </p>
      </div>

      <div className="space-y-32">
        {serviceCategories.map((category) => (
          <section key={category.id} id={category.id} className="scroll-mt-32">
            <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="max-w-xl">
                <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                  {category.title}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full"
              >
                <Link href={category.href} className="flex items-center gap-2">
                  View Detailed Services <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {category.services.map((service) => (
                <div
                  key={service.id}
                  className="group relative flex flex-col rounded-3xl border bg-background/50 p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    {service.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{service.title}</h3>
                  <p className="mb-4 text-sm font-medium text-blue-600 uppercase tracking-wider">
                    {service.tagline}
                  </p>
                  <p className="mb-8 flex-1 text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                  <Link
                    href={`${category.href}#${service.id}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-foreground transition-colors hover:text-blue-600"
                  >
                    Learn More <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA Section */}
      <section className="mt-32 rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-20 text-center text-white shadow-2xl">
        <h2 className="mb-6 text-3xl font-bold md:text-5xl">
          Ready to systematize your growth?
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-100 md:text-xl">
          Stop managing chaos and start building a business that runs itself.
          Let's design your scale-ready operations today.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto rounded-full bg-white text-blue-600 hover:bg-blue-50 h-14 px-8 text-lg font-bold"
          >
            <Link href="/contact">Book a Strategy Call</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 h-14 px-8 text-lg font-bold backdrop-blur-sm"
          >
            <Link href="/pricing">View Pricing Plans</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

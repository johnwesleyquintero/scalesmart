import { Badge } from '@/components/ui/badge';
import {
  Target,
  TrendingUp,
  Zap,
  Users,
  Briefcase,
  Calendar,
} from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  const founders = [
    {
      name: 'John Wesley Quintero',
      role: 'Founder | Operator',
      image: '/images/agency-assets/profile/Wesley_Founder_DP.png',
      description:
        'Founded and built ScaleSmart, a digital solutions agency focused on helping businesses streamline operations and scale efficiently. Designed and implemented virtual assistant workflows, automation systems, and internal tools to improve speed, accountability, and operational clarity.',
      period: 'Jan 2026 - Present',
    },
    {
      name: 'Melkie Quintero',
      role: 'Co-Founder | Management',
      image: '/images/agency-assets/profile/Melkie_Co_Founder_DP.png',
      description:
        'Co-founder of ScaleSmart, delivering digital solutions, virtual assistant services, and tech support to help businesses streamline operations and scale with confidence.',
      period: 'Jan 2026 - Present',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-24 md:py-32">
      {/* Introduction Section */}
      <div className="mb-24 grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <Badge variant="secondary" className="mb-4">
            Our Story
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Building the systems for{' '}
            <span className="text-blue-600">tomorrow's scale.</span>
          </h1>
          <p className="mb-6 text-xl leading-relaxed text-muted-foreground">
            ScaleSmart was created in 2026 to help businesses move faster,
            operate smarter, and scale without chaos.
          </p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Clarity</h3>
                <p className="text-muted-foreground">
                  We eliminate the "messy operations" that slow you down.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Speed</h3>
                <p className="text-muted-foreground">
                  Automated workflows and tech systems built for rapid
                  execution.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Execution</h3>
                <p className="text-muted-foreground">
                  We don't just plan; we build and implement the solutions.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border bg-background/50 p-8 shadow-2xl backdrop-blur-sm">
            <h2 className="mb-6 text-2xl font-bold">Our Philosophy</h2>
            <blockquote className="border-l-4 border-blue-500 pl-6 italic text-lg md:text-xl text-foreground">
              "If you’re building and tired of messy operations, you’re in the
              right place. We don’t just offer services—we build systems. This
              is just the beginning."
            </blockquote>
            <p className="mt-8 text-muted-foreground">
              ScaleSmart focus on virtual assistant workflows and tech systems
              to ensure businesses move with precision. Our approach is rooted
              in the belief that scale is impossible without a solid foundation.
            </p>
          </div>
        </div>
      </div>

      {/* Brand Identity Section */}
      <div className="mb-24 flex justify-center">
        <div className="relative h-24 w-full max-w-lg">
          <Image
            src="/images/agency-assets/images/header_logo.png"
            alt="ScaleSmart Brand Logo"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Founders Section */}
      <div className="mb-24">
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            Meet The Founders
          </Badge>
          <h2 className="text-3xl font-bold md:text-4xl">
            The Minds Behind ScaleSmart
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {founders.map((founder) => (
            <div
              key={founder.name}
              className="group relative overflow-hidden rounded-3xl border bg-background/50 p-8 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-2 border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                  <Image
                    src={founder.image}
                    alt={founder.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{founder.name}</h3>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    >
                      {founder.period}
                    </Badge>
                  </div>
                  <p className="mb-4 font-medium text-blue-600">
                    {founder.role}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {founder.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience Story Section */}
      <div className="relative rounded-3xl border bg-muted/30 p-8 md:p-16 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-12 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold">Our Journey</h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="relative pl-8 border-l-2 border-blue-200 dark:border-blue-900">
                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-blue-600" />
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-600">
                  <Calendar className="h-4 w-4" />
                  JAN 2026 - PRESENT
                </div>
                <h4 className="mb-4 text-xl font-bold">
                  The Foundation of ScaleSmart
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  In early 2026, John Wesley and Melkie Quintero joined forces
                  to address a critical gap in the market: the lack of
                  systematic scaling for small to medium businesses. ScaleSmart
                  was born not just as a service provider, but as a "systems
                  builder."
                </p>
              </div>
              <div className="relative pl-8 border-l-2 border-transparent">
                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-blue-600 bg-background" />
                <h4 className="mb-4 text-xl font-bold">
                  Operational Excellence
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  We focused on three core areas: digital strategy, VA workflow
                  optimization, and scalable tech infrastructure. Our goal was
                  simple: provide the clarity and speed businesses need to move
                  from "messy operations" to confident scaling.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-background/50 p-8 shadow-sm">
              <h4 className="mb-6 flex items-center gap-2 text-lg font-bold">
                <Users className="h-5 w-5 text-blue-600" />A Family-Driven
                Mission
              </h4>
              <p className="text-muted-foreground leading-relaxed italic">
                "We believe that the best systems are built on trust and shared
                vision. As brothers and co-founders, we bring a unique synergy
                to ScaleSmart—combining operational precision with management
                expertise to help our clients succeed."
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Established 2026
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

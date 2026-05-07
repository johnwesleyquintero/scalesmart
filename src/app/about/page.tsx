import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Zap } from 'lucide-react';
import OptimizedImage from '@/components/shared/optimized-image';
import { FadeIn } from '@/components/shared/fade-in';

export default function AboutPage() {
  const founders = [
    {
      name: 'Wesley Quintero',
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
    <main className="container mx-auto px-4 py-24 md:py-32">
      {/* Introduction Section */}
      <section className="mb-24 grid gap-16 lg:grid-cols-2 lg:items-center">
        <FadeIn>
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
        </FadeIn>

        <FadeIn delay={200}>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 blur-2xl dark:from-blue-900/20 dark:to-indigo-900/20" />
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
                in the belief that scale is impossible without a solid
                foundation.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Founders Section */}
      <FadeIn>
        <section className="mb-24">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">
              The Team
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Meet the Founders
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {founders.map((founder) => (
              <div
                key={founder.name} // Changed bg-background/50 to bg-card/50 for better dark mode contrast
                className="group overflow-hidden rounded-3xl border bg-card/50 p-8 shadow-sm transition-all hover:shadow-xl"
              >
                <div className="mb-6 flex flex-col items-center gap-6 md:flex-row md:items-start">
                  <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-2 border-blue-500/20 transition-all group-hover:border-blue-500/50">
                    <OptimizedImage
                      src={founder.image}
                      alt={founder.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{founder.name}</h3>
                    <p className="font-medium text-blue-600">{founder.role}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {founder.period}
                    </p>
                  </div>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {founder.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>
    </main>
  );
}

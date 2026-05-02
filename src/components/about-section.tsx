import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutSection() {
  const founders = [
    {
      name: 'John Wesley Quintero',
      role: 'Founder | Operator',
      image: '/images/agency-assets/profile/Wesley_Founder_DP.png',
    },
    {
      name: 'Melkie Quintero',
      role: 'Co-Founder | Management',
      image: '/images/agency-assets/profile/Melkie_Co_Founder_DP.png',
    },
  ];

  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-purple-500/10 to-blue-500/10 blur-2xl" />
            <div className="relative grid grid-cols-2 gap-4">
              {founders.map((founder, index) => (
                <div
                  key={founder.name}
                  className={`relative overflow-hidden rounded-2xl border bg-background/50 p-4 shadow-xl backdrop-blur-sm ${index === 1 ? 'mt-8' : ''}`}
                >
                  <div className="relative aspect-square mb-4 overflow-hidden rounded-xl">
                    <Image
                      src={founder.image}
                      alt={founder.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="font-bold text-sm md:text-base">
                    {founder.name}
                  </h4>
                  <p className="text-xs text-purple-600 font-medium">
                    {founder.role}
                  </p>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-purple-600/10 blur-2xl" />
          </div>

          <div>
            <Badge variant="secondary" className="mb-4">
              The Team
            </Badge>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
              We are a family-led team{' '}
              <span className="text-purple-600">
                building the future of operations.
              </span>
            </h2>
            <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
              ScaleSmart was founded in 2026 by brothers John Wesley and Melkie
              Quintero. We combined our expertise in digital systems and
              management to help businesses move from chaos to clarity.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30">
                  <Target className="h-5 w-5" />
                </div>
                <p className="font-medium">Focused on Clarity and Speed</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                  <Users className="h-5 w-5" />
                </div>
                <p className="font-medium">Collaborative Systems Design</p>
              </div>
            </div>

            <Button asChild size="lg" className="group">
              <Link href="/about">
                Read Our Full Story
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

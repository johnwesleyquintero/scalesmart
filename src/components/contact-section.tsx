import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LANDING } from '@/constants/marketing';

export default function ContactSection() {
  return (
    <section id="contact" className="container relative mx-auto px-4 py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 via-indigo-900/5 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-transparent"></div>
      </div>

      <div className="w-full relative overflow-hidden rounded-3xl border bg-background/50 p-8 shadow-2xl backdrop-blur-sm md:p-16 text-center border-blue-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            {LANDING.CONTACT.headerPart1}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              {LANDING.CONTACT.headerPart2}
            </span>
          </h2>

          <p className="mb-10 text-xl text-muted-foreground leading-relaxed">
            {LANDING.CONTACT.subhead}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button
                size="lg"
                className="h-14 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
              >
                {LANDING.CONTACT.primaryCta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

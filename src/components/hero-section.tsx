import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail, Triangle, Twitter } from 'lucide-react';
import OptimizedImage from './shared/optimized-image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="container relative mx-auto px-4 py-24 md:py-32">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/30 blur-3xl animate-pulse duration-3000"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-bl from-indigo-400/20 to-blue-400/20 rounded-full blur-2xl animate-float-delayed"></div>
      </div>
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div className="space-y-8 animate-fade-in-up">
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-1 rounded-full px-4 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75 duration-3000"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            Systems-Driven Solutions
          </Badge>

          <div className="relative z-10 p-2 sm:p-4 rounded-[2.5rem] bg-background/20 backdrop-blur-sm border border-white/10 shadow-2xl shadow-blue-500/5 transition-all hover:bg-background/30 hover:shadow-blue-500/10 animate-fade-in-up animation-delay-100">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-8xl">
              <span className="relative inline-block bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-700 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%] drop-shadow-sm">
                ScaleSmart
                <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent,25%,rgba(255,255,255,0.3),50%,transparent,75%,transparent)] bg-[length:200%_100%] animate-shimmer pointer-events-none"></span>
              </span>
            </h1>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 md:text-3xl tracking-tight leading-none">
              We don’t just offer services—
              <span className="text-blue-600">we build systems.</span>
            </p>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              ScaleSmart helps businesses move faster, operate smarter, and
              scale without chaos through digital solutions and optimized
              workflows.
            </p>
          </div>

          <div className="flex items-center gap-4 animate-fade-in-up animation-delay-200">
            <Link
              href="https://github.com/johnwesleyquintero"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="rounded-full bg-background p-3 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 group hover:-translate-y-1 hover:rotate-3 relative overflow-hidden border border-border/50 hover:border-primary/30"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Github className="h-5 w-5 relative z-10" />
            </Link>
            <Link
              href="https://linkedin.com/in/johnwesleyquintero"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="rounded-full bg-background p-3 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:-translate-y-1 hover:rotate-3 group relative overflow-hidden border border-border/50 hover:border-primary/30"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Linkedin className="h-5 w-5 relative z-10" />
            </Link>
            <Link
              href="https://x.com/wesley_q26158"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="rounded-full bg-background p-3 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:-translate-y-1 hover:rotate-3 group relative overflow-hidden border border-border/50 hover:border-primary/30"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Twitter className="h-5 w-5 relative z-10" />
            </Link>
            <Link
              href="mailto:scalesmart.contact@gmail.com"
              aria-label="Email"
              className="rounded-full bg-background p-3 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:-translate-y-1 hover:rotate-3 group relative overflow-hidden border border-border/50 hover:border-primary/30"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Mail className="h-5 w-5 relative z-10" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md animate-fade-in-up animation-delay-300 hover:animate-none group">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-blue-500/20 blur-3xl animate-gradient bg-[length:200%_200%] group-hover:animate-none"></div>
          <div className="relative h-full overflow-hidden rounded-3xl border bg-background/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group perspective-1000">
            <div className="relative w-full h-full transition-transform duration-300 group-hover:scale-105 group-hover:rotate-y-6 group-hover:rotate-3">
              <OptimizedImage
                priority
                className="rounded-lg shadow-xl object-contain w-full h-full"
                src="/images/agency-assets/images/logo_no_bg_with_text.png"
                alt="ScaleSmart Logo"
                fill
                sizes="(max-width: 768px) 100vw, 448px"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

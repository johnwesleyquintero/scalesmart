import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { getAllBlogPosts } from '@/lib/mdx';
import HeroSection from '@/components/hero-section';
import FeatureHighlightsSection from '@/components/feature-highlights-section';
import ProjectsSection from '@/components/projects-section';
import AboutSectionServer from '@/components/about-section-server';
import CertificationsSection from '@/components/certifications-section';
import { BlogSection } from '@/components/blog-section';
import ContactSection from '@/components/contact-section';
import CardLoading from '@/components/shared/CardLoading';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export default async function Home() {
  const blogPosts = await getAllBlogPosts();

  // Load portfolio data

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="grid-background"></div>
      <div className="relative flex flex-col items-center gap-0">
        {/* Hero Section - Full viewport height with enhanced animations */}
        <section className="w-full min-h-screen flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-blue-50/30 dark:from-purple-950/30 dark:via-transparent dark:to-blue-950/30"></div>
          <HeroSection />
        </section>

        {/* Feature Highlights Section - Enhanced with animations */}
        <section className="w-full py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent"></div>
          <FeatureHighlightsSection />
        </section>

        {/* InApp Projects Section */}
        <section className="w-full py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20"></div>
          <ErrorBoundary fallback={<CardLoading />}>
            <Suspense fallback={<CardLoading />}></Suspense>
          </ErrorBoundary>
        </section>

        {/* Projects Section */}
        <section className="w-full py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-tl from-green-50/20 via-transparent to-blue-50/20 dark:from-green-950/20 dark:via-transparent dark:to-blue-950/20"></div>
          <ErrorBoundary fallback={<CardLoading />}>
            <Suspense fallback={<CardLoading />}>
              <ProjectsSection />
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* About Section */}
        <section className="w-full py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-50/20 via-transparent to-red-50/20 dark:from-orange-950/20 dark:via-transparent dark:to-red-950/20"></div>
          <AboutSectionServer />
        </section>

        {/* Certifications Section */}
        <section className="w-full py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-50/20 via-transparent to-indigo-50/20 dark:from-yellow-950/20 dark:via-transparent dark:to-indigo-950/20"></div>
          <CertificationsSection />
        </section>

        {/* Blog Section */}
        <section className="w-full py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-50/20 via-transparent to-purple-50/20 dark:from-pink-950/20 dark:via-transparent dark:to-purple-950/20"></div>
          <BlogSection blogPosts={blogPosts} limit={6} />
        </section>

        {/* Contact Section */}
        <section className="w-full py-20 relative bg-gradient-to-t from-muted/50 to-transparent">
          <ContactSection />
        </section>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { getAllBlogPosts } from '@/lib/mdx';
import HeroSection from '@/components/hero-section';
import FeatureHighlightsSection from '@/components/feature-highlights-section';
import InAppProjects from '@/components/In-App-Project';
import ProjectsSection from '@/components/projects-section';
import AboutSection from '@/components/about-section';
import CertificationsSection from '@/components/certifications-section';
import { BlogSection } from '@/components/blog-section';
import ContactSection from '@/components/contact-section';
import CardLoading from '@/components/shared/CardLoading';

export default async function Home() {
  const blogPosts = await getAllBlogPosts();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="grid-background"></div>
      <div className="relative flex flex-col items-center gap-4">
        <HeroSection />
        <FeatureHighlightsSection />
        <ErrorBoundary fallback={<CardLoading />}>
          {' '}
          {/* Error boundary for InAppProjects */}
          <Suspense fallback={<CardLoading />}>
            <InAppProjects />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary fallback={<CardLoading />}>
          {' '}
          {/* Error boundary for ProjectsSection */}
          <Suspense fallback={<CardLoading />}>
            <ProjectsSection />
          </Suspense>
        </ErrorBoundary>
        {/* Add ErrorBoundaries and Suspense as needed for other sections based on profiling */}
        <AboutSection />
        <CertificationsSection />
        <BlogSection blogPosts={blogPosts} limit={6} />
        <ContactSection />
      </div>
      {/* The main ChatInterface is now handled in the layout */}
    </div>
  );
}

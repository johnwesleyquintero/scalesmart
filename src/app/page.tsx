import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from 'react-error-boundary';
import { getAllBlogPosts } from '@/lib/mdx';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

// Core sections always loaded
import HeroSection from '@/components/hero-section';
import TrustedBySection from '@/components/trusted-by-section';
import WhyUsSection from '@/components/why-us-section';
import HowItWorksSection from '@/components/how-it-works-section';
import CardLoading from '@/components/shared/CardLoading';

// Dynamic sections for performance optimization
const ProjectsSection = dynamic(() => import('@/components/projects-section'), {
  loading: () => <CardLoading />,
  ssr: true,
});

const SuccessStoriesSection = dynamic(
  () => import('@/components/success-stories-section'),
  {
    loading: () => <CardLoading />,
    ssr: true,
  },
);

const AboutSection = dynamic(() => import('@/components/about-section'), {
  loading: () => <CardLoading />,
  ssr: true,
});

const BannerSection = dynamic(() => import('@/components/banner-section'), {
  loading: () => <CardLoading />,
  ssr: true,
});

const BlogSection = dynamic(
  () => import('@/components/blog-section').then((mod) => mod.BlogSection),
  {
    loading: () => <CardLoading />,
    ssr: true,
  },
);

const ContactSection = dynamic(() => import('@/components/contact-section'), {
  loading: () => <CardLoading />,
  ssr: true,
});

// Original static imports for fallback if flag is off
import ProjectsSectionStatic from '@/components/projects-section';
import SuccessStoriesSectionStatic from '@/components/success-stories-section';
import AboutSectionStatic from '@/components/about-section';
import BannerSectionStatic from '@/components/banner-section';
import { BlogSection as BlogSectionStatic } from '@/components/blog-section';
import ContactSectionStatic from '@/components/contact-section';

export default async function Home() {
  const blogPosts = await getAllBlogPosts();
  const useDynamic = FEATURE_FLAGS.DYNAMIC_HOME_SECTIONS;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="grid-background"></div>
      <div className="relative flex flex-col items-center gap-0">
        {/* Hero Section - Full viewport height with enhanced animations */}
        <section className="w-full min-h-screen flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/30"></div>
          <ErrorBoundary fallback={<CardLoading />}>
            <Suspense fallback={<CardLoading />}>
              <HeroSection />
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* Trusted By Section */}
        <TrustedBySection />

        {/* Why Us Section */}
        <section className="w-full relative">
          <ErrorBoundary fallback={<CardLoading />}>
            <Suspense fallback={<CardLoading />}>
              <WhyUsSection />
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Projects Section */}
        <section className="w-full py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-50/20 via-transparent to-indigo-50/20 dark:from-blue-950/20 dark:via-transparent dark:to-indigo-950/20 pointer-events-none"></div>
          <ErrorBoundary fallback={<CardLoading />}>
            <Suspense fallback={<CardLoading />}>
              {useDynamic ? <ProjectsSection /> : <ProjectsSectionStatic />}
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* Success Stories Section */}
        <section className="w-full py-20 relative">
          <ErrorBoundary fallback={<CardLoading />}>
            <Suspense fallback={<CardLoading />}>
              {useDynamic ? (
                <SuccessStoriesSection />
              ) : (
                <SuccessStoriesSectionStatic />
              )}
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* High-Impact Banner Section */}
        {useDynamic ? <BannerSection /> : <BannerSectionStatic />}

        {/* About Section */}
        <section className="w-full py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-transparent to-indigo-50/20 dark:from-blue-950/20 dark:via-transparent dark:to-indigo-950/20 pointer-events-none"></div>
          <ErrorBoundary fallback={<CardLoading />}>
            <Suspense fallback={<CardLoading />}>
              {useDynamic ? <AboutSection /> : <AboutSectionStatic />}
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* Blog Section */}
        <section className="w-full py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/30 blur-3xl pointer-events-none"></div>
          <ErrorBoundary fallback={<CardLoading />}>
            <Suspense fallback={<CardLoading />}>
              {useDynamic ? (
                <BlogSection blogPosts={blogPosts} limit={6} />
              ) : (
                <BlogSectionStatic blogPosts={blogPosts} limit={6} />
              )}
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* Contact Section */}
        <section className="w-full py-20 relative bg-gradient-to-t from-muted/50 to-transparent">
          <ErrorBoundary fallback={<CardLoading />}>
            <Suspense fallback={<CardLoading />}>
              {useDynamic ? <ContactSection /> : <ContactSectionStatic />}
            </Suspense>
          </ErrorBoundary>
        </section>
      </div>
    </div>
  );
}

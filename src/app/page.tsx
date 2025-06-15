import {
  CardLoadingClient,
  ErrorBoundaryClient,
  HeroSectionClient,
} from '../components/client-components';
import FeatureHighlightsSection from '../components/feature-highlights-section';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Only disable SSR for components that truly need client-side features
const CardLoading = CardLoadingClient;

const ErrorBoundary = ErrorBoundaryClient;

const HeroSection = HeroSectionClient;

// Dynamically import components that are likely below the fold
const InAppProjects = dynamic(
  () =>
    import('../components/client-components').then(
      (mod) => mod.InAppProjectsClient,
    ),
  { ssr: false },
);
const ProjectsSection = dynamic(
  () =>
    import('../components/client-components').then(
      (mod) => mod.ProjectsSectionClient,
    ),
  { ssr: false },
);
const AboutSection = dynamic(
  () =>
    import('../components/client-components').then(
      (mod) => mod.AboutSectionClient,
    ),
  { ssr: false },
);
const CertificationsSection = dynamic(
  () =>
    import('../components/client-components').then(
      (mod) => mod.CertificationsSectionClient,
    ),
  { ssr: false },
);
const BlogSection = dynamic(
  () =>
    import('../components/client-components').then(
      (mod) => mod.BlogSectionClient,
    ),
  { ssr: false },
);
const ContactSection = dynamic(
  () =>
    import('../components/client-components').then(
      (mod) => mod.ContactSectionClient,
    ),
  { ssr: false },
);

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="grid-background"></div>
      <div className="relative flex flex-col items-center gap-4">
        <ErrorBoundary>
          <HeroSection />
          <FeatureHighlightsSection />
          <Suspense fallback={null}>
            <InAppProjects />
          </Suspense>
          <Suspense fallback={null}>
            <ProjectsSection />
          </Suspense>
          <Suspense fallback={null}>
            <AboutSection />
          </Suspense>
          <Suspense fallback={null}>
            <CertificationsSection />
          </Suspense>
          <Suspense fallback={null}>
            <BlogSection />
          </Suspense>
          <Suspense fallback={null}>
            <ContactSection />
          </Suspense>
        </ErrorBoundary>
      </div>
      {/* The main ChatInterface is now handled in the layout */}
    </div>
  );
}

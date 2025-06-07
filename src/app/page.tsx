import {
  CardLoadingClient,
  ErrorBoundaryClient,
  ClientChatInterfaceClient,
  HeroSectionClient,
  ProjectsSectionClient,
  AboutSectionClient,
  CertificationsSectionClient,
  BlogSectionClient,
  ContactSectionClient,
  InAppProjectsClient,
} from '../components/client-components';
import { HybridStorageStatusClient } from '../components/client-components/HybridStorageStatusClient'; // Import the new client component directly
import FeatureHighlightsSection from '../components/feature-highlights-section';
// Removed: import { useHybridStorage } from '@/hooks/use-hybrid-storage';

// Only disable SSR for components that truly need client-side features
const CardLoading = CardLoadingClient;

const ErrorBoundary = ErrorBoundaryClient;

const ClientChatInterface = ClientChatInterfaceClient;

const HeroSection = HeroSectionClient;

const ProjectsSection = ProjectsSectionClient;

const AboutSection = AboutSectionClient;

const CertificationsSection = CertificationsSectionClient;

const BlogSection = BlogSectionClient;

const ContactSection = ContactSectionClient;

const InAppProjects = InAppProjectsClient;

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="grid-background"></div>
      <div className="relative flex flex-col items-center gap-4">
        {/* Display storage status using the new client component */}
        <HybridStorageStatusClient />
        <ErrorBoundary>
          <HeroSection />
          <FeatureHighlightsSection />
          <InAppProjects />
          <ProjectsSection />
          <AboutSection />
          <CertificationsSection />
          <BlogSection />
          <ContactSection />
        </ErrorBoundary>
      </div>
      {/* Add the client-side chat interface */}
      <ClientChatInterface />
    </div>
  );
}

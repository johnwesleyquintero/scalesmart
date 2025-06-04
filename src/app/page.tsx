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
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="grid-background"></div>
      <div className="relative flex flex-col items-center gap-4">
        <ErrorBoundary>
          <HeroSection />
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

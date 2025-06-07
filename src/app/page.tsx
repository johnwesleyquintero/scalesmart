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
import FeatureHighlightsSection from '../components/feature-highlights-section';
import { useHybridStorage } from '@/hooks/use-hybrid-storage'; // Import the new hook

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
  // Provide placeholder tableName and keyField for demonstration/compilation
  // In a real app, this hook would likely be used in components managing specific data types.
  // The generic type T is inferred from the usage or can be explicitly provided:
  // const { ... } = useHybridStorage<{ id: string, name: string }>('general_data', 'id');
  const {
    isOnline,
    isLoading,
    error,
    isSyncing,
    getData,
    saveData,
    deleteData,
  } = useHybridStorage('general_data', 'key');

  // Example usage (you would integrate this into your components)
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const myData = await getData('some-key');
  //     console.log('Fetched data:', myData);
  //   };
  //   fetchData();
  // }, [getData]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="grid-background"></div>
      <div className="relative flex flex-col items-center gap-4">
        {/* Display storage status */}
        <div className="text-sm text-gray-600">
          Status: {isLoading ? 'Loading...' : 'Ready'} | Online:{' '}
          {isOnline ? 'Yes' : 'No'} | Syncing: {isSyncing ? 'Yes' : 'No'}
          {error && (
            <span className="text-red-500"> | Error: {error.message}</span>
          )}
        </div>
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

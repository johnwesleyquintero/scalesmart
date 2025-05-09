import Footer from '@/components/footer';
import Header from '@/components/header';
import dynamic from 'next/dynamic';

// Only disable SSR for components that truly need client-side features
const ErrorBoundary = dynamic(() => import('@/components/ui/error-boundary'), {
  loading: () => <div className="min-h-[400px]" />,
});

const ClientChatInterface = dynamic(
  () => import('@/components/ui/client-chat-interface'),
);

// Enable SSR for static content sections
const HeroSection = dynamic(() => import('@/components/hero-section'), {
  ssr: true,
});

const UnifiedDashboard = dynamic(
  () => import('@/components/amazon-seller-tools/unified-dashboard'),
  { ssr: true },
);

const ProjectsSection = dynamic(() => import('@/components/projects-section'), {
  ssr: true,
});

const AboutSection = dynamic(() => import('@/components/about-section'), {
  ssr: true,
});

const CertificationsSection = dynamic(
  () => import('@/components/certifications-section'),
  { ssr: true },
);

const BlogSection = dynamic(() => import('@/components/blog-section'), {
  ssr: true,
});

const ContactSection = dynamic(() => import('@/components/contact-section'), {
  ssr: true,
});

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="relative">
        <Header />
        <ErrorBoundary>
          <HeroSection />
          <UnifiedDashboard />
          <ProjectsSection />
          <AboutSection />
          <CertificationsSection />
          <BlogSection />
          <ContactSection />
          {/* Add the client-side chat interface */}
          <ClientChatInterface />
        </ErrorBoundary>
        <Footer />
      </div>
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';

// Only disable SSR for components that truly need client-side features
const CardLoading = dynamic(() => import('@/components/shared/CardLoading'), {
  ssr: false,
});

const ErrorBoundary = dynamic(() => import('@/components/ui/error-boundary'), {
  loading: () => <CardLoading />,
});

const ClientChatInterface = dynamic(
  () => import('@/components/ui/client-chat-interface'),
  { ssr: false },
);

const HeroSection = dynamic(() => import('@/components/hero-section'), {
  ssr: true,
  loading: () => <CardLoading />,
});

const ProjectsSection = dynamic(() => import('@/components/projects-section'), {
  ssr: true,
  loading: () => <CardLoading />,
});

const AboutSection = dynamic(() => import('@/components/about-section'), {
  ssr: true,
  loading: () => <CardLoading />,
});

const CertificationsSection = dynamic(
  () => import('@/components/certifications-section'),
  { ssr: true, loading: () => <CardLoading /> },
);

const BlogSection = dynamic(() => import('@/components/blog-section'), {
  ssr: true,
  loading: () => <CardLoading />,
});

const ContactSection = dynamic(() => import('@/components/contact-section'), {
  ssr: true,
  loading: () => <CardLoading />,
});

const InAppProjects = dynamic(() => import('@/components/In-App-Project'), {
  ssr: true,
  loading: () => <CardLoading />,
});

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="relative flex flex-col items-center gap-4">
        <ErrorBoundary>
          <HeroSection />
          <InAppProjects />
          <ProjectsSection />
          <AboutSection />
          <CertificationsSection />
          <BlogSection />
          <ContactSection />
          {/* Add the client-side chat interface */}
          <ClientChatInterface />
        </ErrorBoundary>
      </div>
    </div>
  );
}

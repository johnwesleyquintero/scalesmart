'use client';

import dynamic from 'next/dynamic';
import CardLoading from './shared/CardLoading';

const CardLoadingClient = dynamic(() => import('./shared/CardLoading'), {
  ssr: false,
});

const ErrorBoundaryClient = dynamic(() => import('./ui/error-boundary'), {
  loading: () => <CardLoading />,
});

const ClientChatInterfaceClient = dynamic(
  () => import('./ui/client-chat-interface'),
  { ssr: false },
);

const HeroSectionClient = dynamic(() => import('./hero-section'), {
  loading: () => <CardLoading />,
});

const ProjectsSectionClient = dynamic(
  () => import('@/components/projects-section'),
  {
    loading: () => <CardLoading />,
  },
);

const AboutSectionClient = dynamic(() => import('@/components/about-section'), {
  loading: () => <CardLoading />,
});

const CertificationsSectionClient = dynamic(
  () => import('@/components/certifications-section'),
  { loading: () => <CardLoading /> },
);

const BlogSectionClient = dynamic(() => import('@/components/blog-section'), {
  loading: () => <CardLoading />,
});

const ContactSectionClient = dynamic(
  () => import('@/components/contact-section'),
  {
    loading: () => <CardLoading />,
  },
);

const InAppProjectsClient = dynamic(
  () => import('@/components/In-App-Project'),
  {
    loading: () => <CardLoading />,
  },
);

export {
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
};

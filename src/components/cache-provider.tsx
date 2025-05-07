import ClientProviders from './client-providers';

export default async function CacheProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cache functionality will be implemented when needed
  return (
    <ClientProviders>{children}</ClientProviders>
  );
}

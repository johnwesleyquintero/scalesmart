import React from 'react';

export default function GettingStartedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      {/* Include shared UI here, like a sidebar for docs navigation */}
      <nav className="p-4 border-r">
        {/* Example: <ul><li><a href="/docs/getting-started">Getting Started</a></li></ul> */}
      </nav>
      <main>{children}</main>
    </section>
  );
}

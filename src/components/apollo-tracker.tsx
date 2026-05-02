'use client';

import Script from 'next/script';

export default function ApolloTracker() {
  return (
    <Script
      id="apollo-tracker"
      src="https://assets.apollo.io/micro/website-tracker/tracker.iife.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.trackingFunctions && window.trackingFunctions.onLoad) {
          window.trackingFunctions.onLoad({
            appId: '69e9c98e19be35000d0ed8c5',
          });
        }
      }}
    />
  );
}

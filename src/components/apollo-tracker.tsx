'use client';

import Script from 'next/script';

export default function ApolloTracker() {
  return (
    <Script id="apollo-init" strategy="afterInteractive">
      {`
        function initApollo(){
          var n=Math.random().toString(36).substring(7),
          o=document.createElement("script");
          o.src="https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache="+n;
          o.async=!0;
          o.defer=!0;
          o.onload=function(){
            if(window.trackingFunctions && window.trackingFunctions.onLoad) {
              window.trackingFunctions.onLoad({appId:"69e9c98e19be35000d0ed8c5"});
            }
          };
          document.head.appendChild(o);
        }
        initApollo();
      `}
    </Script>
  );
}

import type { AppEvent } from '@/types';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    trackEvent: (event: AppEvent) => void;
  }
}

export function trackEvent(event: AppEvent) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }

  // Redis sync removed - using simplified analytics
}

export function initAnalytics() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());

    gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: window.location.pathname,
      transport_type: 'beacon',
      anonymize_ip: true,
    });

    // Track custom events
    window.trackEvent = trackEvent;
  }
}

export function trackPageView(url: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: url,
    });
  }
}

// Custom event types

export const Analytics = {
  contactSubmitted: () =>
    trackEvent({
      category: 'contact',
      action: 'submit',
      label: 'Contact Form',
    }),
  resumeDownload: () =>
    trackEvent({
      category: 'download',
      action: 'resume_download',
      label: 'PDF Resume',
    }),
  toolUsage: (toolName: string) =>
    trackEvent({
      category: 'tool-usage',
      action: 'execute',
      label: toolName,
    }),
  mongoOperation: (
    operation: 'create' | 'read' | 'update' | 'delete',
    collection: string,
  ) =>
    trackEvent({
      category: 'tool-usage',
      action: `mongo_${operation}`,
      label: collection,
      value: 1,
    }),
};

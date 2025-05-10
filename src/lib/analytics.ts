import type { AppEvent } from '@/types';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
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

  // Sync with Redis for real-time dashboard updates
  if (process.env.KV_URL) {
    fetch(`${process.env.KV_REST_API_URL}/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      },
      body: JSON.stringify({
        timestamp: Date.now(),
        ...event,
      }),
    }).catch(console.error);
  }
}

export function initAnalytics() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
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
type TrackEventParams = {
  category: 'contact' | 'download' | 'tool-usage' | 'error';
  action: string;
  label?: string;
  value?: number;
};

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

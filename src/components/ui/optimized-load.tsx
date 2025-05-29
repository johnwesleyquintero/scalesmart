/// &lt;reference types="react" />
import React, { useEffect, useState } from 'react';
import dynamic, { DynamicOptionsLoadingProps } from 'next/dynamic';
import { useInView } from 'react-intersection-observer';

type OptimizedLoadProps = {
  children: React.ReactNode;
  priority?: boolean;
  fallback?: React.ReactNode;
  threshold?: number;
};

export const OptimizedLoad = ({
  children,
  priority = false,
  fallback = null,
  threshold = 0.1,
}: OptimizedLoadProps) => {
  const [shouldRender, setShouldRender] = useState(priority);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      setShouldRender(true);
    }
  }, [inView]);

  return <div ref={ref}>{shouldRender ? children : fallback}</div>;
};

// Helper function to create optimized dynamic imports
export function createOptimizedComponent<T>(
  importFunc: () => Promise<{ default: React.ComponentType<T> }>,
  options: {
    ssr?: boolean;
    loading?: (props: DynamicOptionsLoadingProps) => React.JSX.Element;
  } = {},
) {
  return dynamic(importFunc, {
    loading: options.loading,
    ssr: options.ssr ?? false,
  });
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' &&
      typeof window !== 'undefined'
    ) {
      // Monitor CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as LayoutShift[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Monitor LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as LargestContentfulPaint[];
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry?.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Monitor FID
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: FirstInputDelay) => {
          if (entry.processingStart && entry.startTime) {
            const delay = entry.processingStart - entry.startTime;
            console.log('FID:', delay);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      return () => {
        clsObserver.disconnect();
        lcpObserver.disconnect();
        fidObserver.disconnect();
      };
    }
  }, []);
}

// TypeScript interfaces for Web Performance API
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface LargestContentfulPaint extends PerformanceEntry {
  renderTime: number;
  loadTime: number;
  size: number;
  id: string;
  url: string;
  element?: Element;
}

interface FirstInputDelay extends PerformanceEntry {
  processingStart?: number;
  processingEnd?: number;
  startTime: number;
}

// Example usage:
// const HeavyComponent = createOptimizedComponent(() => import('./HeavyComponent'));
//
// function Page() {
//   usePerformanceMonitor();
//   return (
//     <OptimizedLoad>
//       <HeavyComponent />
//     </OptimizedLoad>
//   );
// }

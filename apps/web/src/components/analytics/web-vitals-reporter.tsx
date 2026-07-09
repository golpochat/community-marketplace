'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type VitalMetric = {
  name: string;
  value: number;
};

function reportToGa4(metric: VitalMetric) {
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_category: 'Web Vitals',
    non_interaction: true,
  });
}

function observeLcp() {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (last) reportToGa4({ name: 'LCP', value: last.startTime });
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Unsupported browser
  }
}

function observeCls() {
  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        hadRecentInput?: boolean;
        value?: number;
      })[]) {
        if (!entry.hadRecentInput && entry.value) clsValue += entry.value;
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });

    const report = () => reportToGa4({ name: 'CLS', value: clsValue });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') report();
    });
    window.addEventListener('pagehide', report);
  } catch {
    // Unsupported browser
  }
}

function observeInp() {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const timing = entry as PerformanceEntry & { duration?: number };
        if (timing.duration != null) {
          reportToGa4({ name: 'INP', value: timing.duration });
        }
      }
    });
    observer.observe({ type: 'event', buffered: true });
  } catch {
    // Unsupported browser
  }
}

/** Reports Core Web Vitals to GA4 when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is configured. */
export function WebVitalsReporter() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()) return;
    observeLcp();
    observeCls();
    observeInp();
  }, []);

  return null;
}

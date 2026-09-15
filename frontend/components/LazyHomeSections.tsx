'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const FeaturedProjectsCarousel = dynamic(() => import('@/components/FeaturedProjectsCarousel'), {
  loading: () => <div className="min-h-[520px] bg-[#0d131f]" />,
  ssr: false,
});

const ReviewsCarousel = dynamic(() => import('@/components/ReviewsCarousel'), {
  loading: () => <div className="min-h-[420px] bg-white dark:bg-gray-800" />,
  ssr: false,
});

const CalculadoraPrecios = dynamic(() => import('@/components/CalculadoraPrecios'), {
  loading: () => <div className="min-h-[520px] bg-[#0d131f]" />,
  ssr: false,
});

const LocationSection = dynamic(() => import('@/components/LocationSection'), {
  loading: () => <div className="min-h-[520px] bg-gray-50 dark:bg-gray-900" />,
  ssr: false,
});

export default function LazyHomeSections() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const sentinel = document.querySelector('[data-home-sections]');
    if (!sentinel) return;

    if (!('IntersectionObserver' in window)) {
      const timer = globalThis.setTimeout(() => setShouldLoad(true), 0);
      return () => globalThis.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div data-home-sections>
      {shouldLoad ? (
        <>
          <FeaturedProjectsCarousel />
          <ReviewsCarousel />
          <CalculadoraPrecios />
          <LocationSection />
        </>
      ) : (
        <div className="min-h-[1980px]" aria-hidden="true" />
      )}
    </div>
  );
}

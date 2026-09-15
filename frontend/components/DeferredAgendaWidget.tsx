'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const AgendaWidget = dynamic(() => import('@/components/AgendaWidget'), {
  ssr: false,
  loading: () => null,
});

export default function DeferredAgendaWidget() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => setReady(true);
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const usesIdleCallback = 'requestIdleCallback' in window;
    if (usesIdleCallback) {
      idleId = window.requestIdleCallback(load, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(load, 1000);
    }

    return () => {
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return ready ? <AgendaWidget /> : null;
}

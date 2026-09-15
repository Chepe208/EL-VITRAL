'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'el-vitral-legal-notice-seen';

export default function LegalNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== '1');
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[60] rounded-2xl border border-gray-700 bg-[#161f30]/95 p-4 text-xs text-gray-200 shadow-2xl backdrop-blur sm:inset-x-auto sm:right-4 sm:max-w-lg">
      <p className="leading-5">
        Usamos cookies técnicas necesarias para iniciar sesión y operar el sitio. Algunos servicios externos pueden procesar datos técnicos. Consulta nuestra{' '}
        <Link href="/politica-cookies" className="text-cyan-400 underline hover:text-cyan-300">política de cookies</Link>{' '}
        y <Link href="/politica-privacidad" className="text-cyan-400 underline hover:text-cyan-300">política de privacidad</Link>.
      </p>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, '1');
          setVisible(false);
        }}
        className="mt-3 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-500"
      >
        Entendido
      </button>
    </aside>
  );
}

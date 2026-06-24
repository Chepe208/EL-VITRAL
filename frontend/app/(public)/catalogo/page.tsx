'use client';
import { Suspense } from "react";
import CatalogoContent from '@/components/CatalogoContent';

export default function CatalogoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101828'}}>
                <div className="text-white text-xl">Cargando productos...</div>
            </div>
        }>
            <CatalogoContent />
        </Suspense>
    );
}
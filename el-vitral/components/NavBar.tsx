'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import Image from 'next/image';

export default function Navbar() {
    const [user, setUser] = useState<any>(null);
    const pathname = usePathname();

    useEffect(() => {
        const fetchUser = async () => {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
        };
        fetchUser();
    }, []);

    const logout = async () => {
        await fetch('/api/auth/logout', { method: "POST"});
        setUser (null);
        window.location.href = '/';
    };

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/">
                        <Image src="/logo.jpeg" alt="El Vitral" width={1032} height={288} className="h-12 w-auto"/>
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className={`font-medium ${pathname === '/' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}> Inicio </Link>
                        <Link href="/catalogo" className={`font-medium ${pathname === '/catalogo' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}> Catalogo </Link>
                        <Link href="/cotizar" className={`font-medium ${pathname === '/cotizar' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}> Cotizar </Link>
                        {user && (
                            <>
                            <Link href="/mis-pedidos" className={`font-medium ${pathname === '/mis-pedidos' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}> Mis Pedidos </Link>
                            {user.rol === 'admin' && (
                                <Link href="/admin" className={`font-medium ${pathname.startsWith('/admin') ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}> Admin </Link>
                            )}
                            </>
                        )}
                        <div className="relative group">
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-3xl cursor-pointer"> menu </span>
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block border border-gray-200 dark:border-gray-700">
                                {!user ? (
                                    <>
                                    <Link href="/login" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"> Iniciar Sesión </Link>
                                    <Link href="/registro" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"> Registrarse </Link>
                                    </>
                                ) : (
                                    <>
                                    <span className="block px-4 py-2 text-sm text-gray-500">Hola, {user.nombre}</span>
                                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"> Cerrar Sesión </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
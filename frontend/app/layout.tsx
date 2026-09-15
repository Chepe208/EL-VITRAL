import type { Metadata } from 'next'
import './globals.css'
import Footer from '@/components/Footer'
import NavBar from '@/components/NavBar'
import DeferredAgendaWidget from '@/components/DeferredAgendaWidget'
import { AuthProvider } from '@/components/AuthProvider'
import LegalNotice from '@/components/LegalNotice'

export const metadata: Metadata = {
  title: 'El Vitral',
  description: 'Descubre nuestras instalaciones de vidrio',
  icons: {
    icon: '/logo2.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />
      </head>
      <body className="font-sans overflow-x-hidden">
        <AuthProvider>
          <NavBar />
          <div className="min-h-screen flex flex-col w-full">
            <main className="flex-1 w-full">{children}</main>
            <Footer />
          </div>
          <DeferredAgendaWidget />
          <LegalNotice />
        </AuthProvider>
      </body>
    </html>
  )
}
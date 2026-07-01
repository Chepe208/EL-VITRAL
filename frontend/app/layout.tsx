import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Footer from '@/components/Footer'
import NavBar from '@/components/NavBar'
import AgendaWidget from '@/components/AgendaWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'El Vitral',
  description: 'Descubre nuestras instalaciones de vidrio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body className={inter.className}>
                <NavBar />
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <AgendaWidget />
      </body>
    </html>
  )
}
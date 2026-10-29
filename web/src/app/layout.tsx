import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import './globals.css'

// Variable Archivo with its width axis (62–125%) for expanded headings.
const archivo = Archivo({ variable: '--font-archivo', subsets: ['latin'], axes: ['wdth'] })

export const metadata: Metadata = {
  title: 'TruckSoft Portal',
  description: 'One place to open every TruckSoft app and tool you use at work',
}

export const viewport: Viewport = {
  themeColor: '#EDEFF2',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} min-h-screen bg-concrete font-sans text-ink antialiased`}>
        {children}
      </body>
    </html>
  )
}

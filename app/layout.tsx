import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { IpTracker } from "@/components/ip-tracker"
import { PWAProvider } from "@/components/pwa-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Falando com o Profeta - William Branham",
  description: "Converse com o Profeta William Branham através de IA baseada em suas mensagens",
  generator: 'v0.dev',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Falando com o Profeta'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Falando com o Profeta" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <script src="/sw-register.js" defer></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <IpTracker />
          <PWAProvider>
            {children}
          </PWAProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

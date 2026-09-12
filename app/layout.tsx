import { Instrument_Serif, Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { SITE_ORIGIN } from '@/lib/site'
import { Metadata } from 'next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: {
    default: 'SEO Boost | HTML technical SEO audits',
    template: '%s | SEO Boost',
  },
  description:
    'Crawl a site up to 50 pages on Hobby or 500 on Pro, run 48 HTML and domain checks, and get an A–F health score with a fix list. Not Core Web Vitals. Not a GEO score.',
  keywords: [
    'SEO Tool',
    'SEO Audit',
    'Website Health Checker',
    'Site Analyzer',
    'SEO Report',
    'Search Engine Optimization',
    'Technical SEO',
  ],
  authors: [{ name: 'SEO Boost Team' }],
  creator: 'SEO Boost',
  metadataBase: new URL(SITE_ORIGIN),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_ORIGIN,
    siteName: 'SEO Boost',
    title: 'SEO Boost | HTML technical SEO audits',
    description:
      'HTML crawl up to 50/500 pages, 48 HTML and domain checks, A–F health score and a fix list.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'SeoBoost technical SEO audits from the first HTML',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEO Boost | HTML technical SEO audits',
    description:
      'HTML crawl up to 50/500 pages, 48 HTML and domain checks, A–F health score and a fix list.',
    images: ['/twitter-image.png'],
    creator: '@seoboost',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${inter.className} ${inter.variable} ${instrumentSerif.variable}`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:m-2"
        >
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

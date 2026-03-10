import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'SEO Boost | Instant SEO Audits & Website Health Reports',
    template: '%s | SEO Boost',
  },
  description:
    'Get a professional SEO audit in under 8 seconds. Analyze your website health, fix technical issues, and rank higher on Google with actionable reports.',
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
  metadataBase: new URL('https://seoboost.app'),
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
    url: 'https://seoboost.app',
    siteName: 'SEO Boost',
    title: 'SEO Boost | Instant SEO Audits & Website Health Reports',
    description:
      'The simplest and fastest way to optimize your domain. Get actionable reports in seconds.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'SEO Boost Branding',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEO Boost | Fix Your SEO in 8 Seconds',
    description:
      'Professional SEO audits for founders and developers. Instant, actionable, and beautiful reports.',
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

import Script from 'next/script'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SEO Boost',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '9.00',
      priceCurrency: 'USD',
    },
    description:
      'Professional technical SEO audits in seconds. Fix your website issues and rank higher.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '120',
    },
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

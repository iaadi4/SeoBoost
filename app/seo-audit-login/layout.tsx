import { Metadata } from 'next'
import { NOINDEX_ROBOTS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to your SEO Boost account to view your technical SEO audit reports and scan domains.',
  robots: NOINDEX_ROBOTS,
  alternates: {
    canonical: '/seo-audit-login',
  },
}

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

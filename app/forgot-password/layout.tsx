import { Metadata } from 'next'
import { NOINDEX_ROBOTS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Request a link to choose a new SeoBoost password.',
  robots: NOINDEX_ROBOTS,
  alternates: {
    canonical: '/forgot-password',
  },
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

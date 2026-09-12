import { Metadata } from 'next'
import { NOINDEX_ROBOTS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Choose a new password for your SeoBoost account.',
  robots: NOINDEX_ROBOTS,
  alternates: {
    canonical: '/reset-password',
  },
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

import { Metadata } from 'next'
import { NOINDEX_ROBOTS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Report',
  robots: NOINDEX_ROBOTS,
  alternates: {
    canonical: '/dashboard/report',
  },
}

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

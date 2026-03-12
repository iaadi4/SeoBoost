import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SEO Audit Login | SEO Boost',
  description: 'Sign in to your SEO Boost account to view your technical SEO audit reports and scan domains.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

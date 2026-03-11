import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | SEO Boost',
  description: 'Sign in to your SEO Boost account to view your technical SEO audit reports and scan domains.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up | SEO Boost',
  description: 'Create a free SEO Boost account to get instant technical SEO audits and website health reports.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

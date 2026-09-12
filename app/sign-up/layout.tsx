import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign up',
  description:
    'Create a free SEO Boost account to get instant technical SEO audits and website health reports.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/sign-up',
  },
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

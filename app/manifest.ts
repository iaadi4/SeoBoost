import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SEO Boost | Instant SEO Audits',
    short_name: 'SEO Boost',
    description:
      'Optimize your website SEO in seconds with professional technical audits.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f3ee',
    theme_color: '#1c1915',
    icons: [
      {
        src: '/icon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

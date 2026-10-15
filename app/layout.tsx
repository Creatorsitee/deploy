import type { Metadata } from 'next';
import './globals.css'; // Global styles
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'CMNTY Deploy — Free Web Deploy & Simple Deployment',
  description: 'Free Deploy and simple deployment platform powered by CMNTY Edge API. Deploy static and modern web apps instantly with automated custom subdomains and SSL certificates.',
  keywords: [
    'free Deploy',
    'web Deploy',
    'simple deployment',
    'cloud edge api',
    'custom subdomains',
    'free ssl certificates',
    'nextjs Deploy',
    'vite Deploy',
    'react Deploy',
    'static web deployment'
  ],
  authors: [{ name: 'CMNTY' }],
  robots: 'index, follow',
  alternates: {
    canonical: 'https://cmnty.biz.id',
  },
  openGraph: {
    title: 'CMNTY Deploy — Free Web Deploy & Simple Deployment',
    description: 'Free Deploy and simple deployment platform powered by CMNTY Edge API. Deploy static and modern web apps instantly with automated custom subdomains and SSL certificates.',
    type: 'website',
    url: 'https://cmnty.biz.id',
    siteName: 'CMNTY Deploy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CMNTY Deploy — Free Web Deploy & Simple Deployment',
    description: 'Free Deploy and simple deployment platform powered by CMNTY Edge API. Deploy static and modern web apps instantly with automated custom subdomains and SSL certificates.',
    creator: '@cmnty',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'CMNTY Deploy',
    'url': 'https://cmnty.biz.id',
    'applicationCategory': 'DeveloperApplication',
    'operatingSystem': 'All',
    'description': 'Free Deploy and simple deployment platform powered by CMNTY Edge API. Deploy static and modern web apps instantly with automated custom subdomains and SSL certificates.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

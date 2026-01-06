import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '뉴스 브리핑 - 과학 & 기술 뉴스',
  description: 'AI가 요약한 최신 과학/기술 뉴스를 빠르게 확인하세요.',
  keywords: ['뉴스', 'AI', '과학', '기술', '뉴스 요약', '뉴스 큐레이션'],
  authors: [{ name: 'News Curation Team' }],
  openGraph: {
    title: '뉴스 브리핑 - 과학 & 기술 뉴스',
    description: 'AI가 요약한 최신 과학/기술 뉴스를 빠르게 확인하세요.',
    type: 'website',
    locale: 'ko_KR',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}

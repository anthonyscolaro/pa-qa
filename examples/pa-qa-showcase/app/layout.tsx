import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/navigation/Navbar';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'PA-QA Testing Showcase',
    template: '%s | PA-QA Testing Showcase',
  },
  description: 'A comprehensive testing framework showcase built with Next.js 14, featuring modern testing patterns, MDX documentation, and best practices for web development agencies.',
  keywords: [
    'testing',
    'qa',
    'quality assurance',
    'next.js',
    'react',
    'typescript',
    'mdx',
    'documentation',
    'framework',
    'web development',
    'agency',
  ],
  authors: [
    {
      name: 'PA-QA Team',
      url: 'https://projectassistant.ai',
    },
  ],
  creator: 'PA-QA Team',
  publisher: 'Project Assistant',
  metadataBase: new URL('https://pa-qa-showcase.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pa-qa-showcase.vercel.app',
    title: 'PA-QA Testing Showcase',
    description: 'A comprehensive testing framework showcase built with Next.js 14, featuring modern testing patterns, MDX documentation, and best practices.',
    siteName: 'PA-QA Testing Showcase',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PA-QA Testing Showcase',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PA-QA Testing Showcase',
    description: 'A comprehensive testing framework showcase built with Next.js 14, featuring modern testing patterns and best practices.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  colorScheme: 'light dark',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/jetbrains-mono-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`
          min-h-screen bg-white font-sans text-secondary-900 antialiased
          dark:bg-secondary-950 dark:text-secondary-100
          selection:bg-primary-200 selection:text-primary-900
          dark:selection:bg-primary-800 dark:selection:text-primary-100
        `}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="pa-qa-theme"
        >
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ThemeProvider>

        {/* Scroll to top functionality */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Add smooth scrolling to anchor links
              document.addEventListener('DOMContentLoaded', function() {
                document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                  anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                      target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }
                  });
                });
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
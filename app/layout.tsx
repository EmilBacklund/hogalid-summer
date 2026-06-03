import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/providers';
import { InstallPrompt } from '@/components/common';

export const metadata: Metadata = {
  title: 'Högalid F15 — Sommarlovet 2026',
  description: 'Gamifierad sommarträning för Högalid F15.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sommarlovet',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#001540',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <Providers>{children}</Providers>
        <InstallPrompt />
      </body>
    </html>
  );
}

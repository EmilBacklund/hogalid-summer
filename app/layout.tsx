import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Högalid F15 — Sommarlovet 2026',
  description: 'Gamifierad sommarträning för Högalid F15.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}

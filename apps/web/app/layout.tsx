import type { Metadata, Viewport } from 'next';
import './global.css';

export const metadata: Metadata = {
  title: 'Richingness Financial OS',
  description: 'Give Every Rupee a Purpose'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased select-none">
        {children}
      </body>
    </html>
  );
}

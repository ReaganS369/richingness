import type { Metadata } from 'next';
import './global.css';

export const metadata: Metadata = {
  title: 'Richingness Financial OS',
  description: 'Give Every Rupee a Purpose'
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

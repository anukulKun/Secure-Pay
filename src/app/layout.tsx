import './globals.css';
import { Inter } from 'next/font/google';
import LandingNavbar from '@/components/LandingNavbar';
import RootClientLayout from './RootClientLayout'; // Import the client wrapper

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'SecurePay | Secure Crypto Transfers on multiple evm chains',
  description: 'Secure crypto transfers, group payments, and smart savings on the multiple evm chains',
  keywords: 'crypto, payments, blockchain, electroneum, educhain, flow, kaia, ancient8, DeFi, secure transfers, group payments',
  authors: [{ name: 'SecurePay' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <RootClientLayout>
          {children}
        </RootClientLayout>
      </body>
    </html>
  );
}

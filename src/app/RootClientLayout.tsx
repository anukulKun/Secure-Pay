// RootClientLayout.tsx

'use client'

import { WalletProvider } from '@/context/WalletContext';
import { useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';

export default function RootClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <WalletProvider>
        {/* Background Elements - adaptive to theme */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-black dark:to-green-950" />
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-5 dark:opacity-20" />

        {/* Gradient Orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-green-500/5 via-transparent to-transparent dark:from-green-500/10 blur-3xl transform rotate-12 animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-t from-green-500/5 via-transparent to-transparent dark:from-green-500/10 blur-3xl transform -rotate-12 animate-pulse delay-1000" />
        </div>

        {children}
      </WalletProvider>
    </ThemeProvider>
  );
}
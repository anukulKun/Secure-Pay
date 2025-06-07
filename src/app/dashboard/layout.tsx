'use client'

import React, { useState, useEffect } from 'react'
import DashboardSidebar from '@/components/DashboardSidebar'
import { Inter } from 'next/font/google'

// Import Inter font directly in the dashboard layout so it doesn't inherit from parent
const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // Handle theme toggle
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    
    // Apply theme classes
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
    
    // Save preference to localStorage
    localStorage.setItem('securepay-theme', newDarkMode ? 'dark' : 'light')
  }
  
  // Initialize theme from localStorage on mount
  useEffect(() => {
    setMounted(true)
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('securepay-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    // Set theme based on saved preference or system preference
    const shouldUseDark = savedTheme === 'dark' || (savedTheme === null && prefersDark)
    
    setIsDarkMode(shouldUseDark)
    
    // Apply theme classes
    if (shouldUseDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className={`${inter.className} flex flex-col min-h-screen`}>
      {/* Background Elements - Light mode and dark mode backgrounds */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:via-black dark:to-green-950" />
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-5 dark:opacity-20" />
      
      {/* Content */}
      <div className="relative flex flex-grow z-10">
        {/* Sidebar - using our sidebar component class */}
        <DashboardSidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        
        {/* Main Content */}
        <div className="flex-grow md:ml-64 transition-all">
          <main className="min-h-screen p-4 md:p-6 pt-16 md:pt-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

const LandingNavbar: React.FC = () => {
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [mounted, setMounted] = useState(false)
  
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

  if (!mounted) {
    return null
  }

  return (
    <nav className="relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="relative group">
            <motion.div
              className="absolute -inset-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur-lg group-hover:opacity-100 opacity-0 transition-opacity duration-300"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            <motion.span
              className="relative text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              SecurePay
            </motion.span>
          </Link>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleDarkMode}
              className="relative p-2 rounded-full bg-black/20 backdrop-blur-sm border border-green-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5 text-yellow-300" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-300" />
              )}
            </motion.button>

            {/* Launch App Button */}
            <motion.button
              onClick={() => router.push('/dashboard')}
              className="relative flex items-center space-x-2 px-6 py-2 rounded-xl font-medium overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300 group-hover:opacity-100 opacity-90" />
              <span className="relative text-black font-medium">
                Launch App
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default LandingNavbar

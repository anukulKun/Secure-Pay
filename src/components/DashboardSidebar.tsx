'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HomeIcon,
  ArrowRightIcon,
  UsersIcon,
  WalletIcon,
  BanknotesIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline'
import { useAccount, useDisconnect } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import ChainSelector from './ChainSelector'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <HomeIcon className="w-5 h-5" /> },
  { href: '/dashboard/transfer', label: 'Transfer', icon: <ArrowRightIcon className="w-5 h-5" /> },
  { href: '/dashboard/group-payments', label: 'Group Payments', icon: <UsersIcon className="w-5 h-5" /> },
  { href: '/dashboard/savings-pots', label: 'Saving Pots', icon: <BanknotesIcon className="w-5 h-5" /> },
  { href: '/dashboard/history', label: 'History', icon: <UserCircleIcon className="w-5 h-5" /> }
]

interface DashboardSidebarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isDarkMode, toggleDarkMode }) => {
  const pathname = usePathname()
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { disconnect } = useDisconnect()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false)

  // Close mobile menu on navigation and resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [pathname])

  const handleWalletAction = () => {
    if (address) {
      setIsWalletMenuOpen(!isWalletMenuOpen)
    } else if (openConnectModal) {
      openConnectModal()
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setIsWalletMenuOpen(false)
  }

  // Desktop Sidebar
  const renderSidebar = () => (
    <div className="h-full flex flex-col py-6 overflow-hidden">
      {/* Logo */}
      <div className="px-6 mb-8">
        <Link href="/" className="relative group">
          <motion.span
            className="text-xl font-bold bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--primary))]/70 text-transparent bg-clip-text"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            SecurePay
          </motion.span>
        </Link>
      </div>

      {/* Chain Selector - Moved to the top for better visibility */}
      <div className="px-4 mb-4">
        <p className="text-xs uppercase text-[rgb(var(--muted-foreground))] mb-2 ml-2 font-medium">Network</p>
        <ChainSelector />
      </div>

      {/* Navigation Links - with scroll if needed */}
      <div className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <motion.div
                  className={`flex items-center px-3 py-3 rounded-xl group relative ${
                    pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                      ? 'text-[rgb(var(--primary))] dark:text-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10' 
                      : 'text-[rgb(var(--foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]/50 dark:text-[rgb(var(--muted-foreground))] dark:hover:text-[rgb(var(--foreground))] dark:hover:bg-[rgb(var(--primary))]/5'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center">
                    <span className="mr-3">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </span>
                </motion.div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Bottom Section - Wallet & Theme Toggle */}
      <div className="px-3 mt-auto space-y-3">
        {/* Wallet */}
        <div className="relative">
          <motion.button
            onClick={handleWalletAction}
            className={`flex justify-between items-center w-full px-4 py-3 rounded-xl font-medium overflow-hidden group ${
              address 
                ? 'bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]' 
                : 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-2">
              <WalletIcon className="w-5 h-5" />
              <span className="truncate max-w-[120px]">
                {address 
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : 'Connect Wallet'
                }
              </span>
            </div>
          </motion.button>
          
          {/* Wallet Dropdown */}
          <AnimatePresence>
            {isWalletMenuOpen && address && (
              <motion.div
                className="absolute bottom-full left-0 right-0 mb-1 bg-[rgb(var(--background))]/80 backdrop-blur-lg border border-[rgb(var(--border))]/30 rounded-lg overflow-hidden shadow-sm"
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={handleDisconnect}
                  className="flex items-center w-full px-4 py-3 text-left text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]/50 dark:hover:bg-[rgb(var(--primary))]/5 transition-colors"
                >
                  <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2 text-red-500 dark:text-red-400" />
                  <span>Disconnect</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Theme Toggle */}
        <motion.button
          onClick={toggleDarkMode}
          className="flex items-center w-full px-4 py-3 rounded-xl text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]/50 dark:hover:bg-[rgb(var(--primary))]/5 mb-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isDarkMode ? (
            <>
              <SunIcon className="w-5 h-5 mr-3 text-yellow-500 dark:text-yellow-300" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <MoonIcon className="w-5 h-5 mr-3 text-[rgb(var(--foreground))]/60" />
              <span>Dark Mode</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <motion.button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-[rgb(var(--card))]/50 backdrop-blur-lg border border-[rgb(var(--border))]/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Menu"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="w-6 h-6 text-[rgb(var(--foreground))]" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-[rgb(var(--foreground))]" />
          )}
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-[rgb(var(--background))]/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Sidebar Content */}
            <motion.div
              className="absolute inset-y-0 left-0 w-64 bg-[rgb(var(--background))] border-r border-[rgb(var(--border))]/30 shadow-lg"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {renderSidebar()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-64 h-full fixed left-0 z-30 border-r border-[rgb(var(--border))]/30 bg-[rgb(var(--background))]">
        {renderSidebar()}
      </div>
    </>
  )
}

export default DashboardSidebar

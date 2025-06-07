'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  ArrowRightIcon,
  UsersIcon,
  WalletIcon,
  BanknotesIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { useAccount, useDisconnect, useChainId } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import ChainSelector from './ChainSelector'

const navItems = [
  { href: '/', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
  { href: '/transfer', label: 'Transfer', icon: <ArrowRightIcon className="w-5 h-5" /> },
  { href: '/group-payments', label: 'Group Payments', icon: <UsersIcon className="w-5 h-5" /> },
  { href: '/savings-pots', label: 'Saving Pots', icon: <BanknotesIcon className="w-5 h-5" /> },
]

const Navbar: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { address } = useAccount()
  const chainId = useChainId()
  const { openConnectModal } = useConnectModal()
  const { disconnect } = useDisconnect()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [prevChainId, setPrevChainId] = useState<number>()

  useEffect(() => {
    if (chainId && prevChainId && chainId !== prevChainId) {
      // Refresh the current page when chain changes
      router.refresh()
      
      // Optional: Add a small delay before refreshing to ensure contract states are updated
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
    setPrevChainId(chainId)
  }, [chainId, prevChainId, router])

  const handleWalletClick = () => {
    if (address) {
      disconnect()
    } else {
      openConnectModal?.()
    }
  }

  return (
    <nav className="relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="relative group">
            <motion.div
              className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-lg blur-lg group-hover:opacity-100 opacity-0 transition-opacity duration-300"
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
              className="relative text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-500 text-transparent bg-clip-text"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              SecurePay
            </motion.span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={`relative px-3 py-2 rounded-xl group ${
                    pathname === item.href 
                      ? 'text-blue-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {pathname === item.href && (
                    <motion.div
                      className="absolute inset-0 bg-blue-500/10 rounded-xl"
                      layoutId="navbar-active"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative flex items-center space-x-1">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                </motion.div>
              </Link>
            ))}

            {/* Profile Link */}
            {address && (
              <Link href="/profile">
                <motion.div
                  className={`relative px-3 py-2 rounded-xl group ${
                    pathname === '/profile'
                      ? 'text-blue-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {pathname === '/profile' && (
                    <motion.div
                      className="absolute inset-0 bg-blue-500/10 rounded-xl"
                      layoutId="navbar-active"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative flex items-center space-x-1">
                    <UserCircleIcon className="w-5 h-5" />
                    <span>Profile</span>
                  </span>
                </motion.div>
              </Link>
            )}

            {/* Chain Selector */}
            <ChainSelector />

            {/* Wallet Button */}
            <motion.button
              onClick={handleWalletClick}
              className="relative flex items-center space-x-2 px-4 py-2 rounded-xl font-medium overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300 group-hover:opacity-100 opacity-90" />
              <WalletIcon className="w-5 h-5 relative text-black" />
              <span className="relative text-black">
                {address 
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : 'Connect Wallet'
                }
              </span>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative p-2 rounded-xl bg-black/20 backdrop-blur-sm border border-blue-500/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isMenuOpen ? 'close' : 'open'}
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? (
                  <XMarkIcon className="w-6 h-6 text-white" />
                ) : (
                  <Bars3Icon className="w-6 h-6 text-white" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden absolute inset-x-0 top-full mt-2 mx-4 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-4 space-y-2">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-colors ${
                        pathname === item.href
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-gray-400 hover:bg-blue-500/10 hover:text-white'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </motion.div>
                  </Link>
                ))}

                {address && (
                  <Link href="/profile">
                    <motion.div
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-colors ${
                        pathname === '/profile'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-gray-400 hover:bg-blue-500/10 hover:text-white'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      <span>Profile</span>
                    </motion.div>
                  </Link>
                )}

                {/* Chain Selector for Mobile */}
                <div className="px-4 py-2">
                  <ChainSelector />
                </div>

                {/* Mobile Wallet Button */}
                <motion.button
                  onClick={() => {
                    handleWalletClick()
                    setIsMenuOpen(false)
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-emerald-500 text-black"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <WalletIcon className="w-5 h-5" />
                  <span>
                    {address 
                      ? `${address.slice(0, 6)}...${address.slice(-4)}`
                      : 'Connect Wallet'
                    }
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

export default Navbar
import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useWallet } from '@/context/WalletContext'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export interface ChainInfo {
  id: number
  hexId: string
  name: string
  icon: string
  symbol: string
  rpcUrl: string
  blockExplorerUrl: string
}

export const supportedChains: ChainInfo[] = [
  {
    id: 52014,
    hexId: '0xCB2E',
    name: 'Electroneum Mainnet',
    icon: '/chains/electroneum.png',
    symbol: 'ETN',
    rpcUrl: 'https://rpc.ankr.com/electroneum',
    blockExplorerUrl: 'https://blockexplorer.electroneum.com/'
  },
  {
    id: 5201420,
    hexId: '0x4F5E0C',
    name: 'Electroneum Testnet',
    icon: '/chains/electroneum.png',
    symbol: 'ETN',
    rpcUrl: 'https://rpc.ankr.com/electroneum_testnet',
    blockExplorerUrl: 'https://blockexplorer.thesecurityteam.rocks/'
  },
  {
    id: 41923,
    hexId: '0xA3C3',
    name: 'EDU Chain Mainnet',
    icon: '/chains/educhain.png',
    symbol: 'EDU',
    rpcUrl: 'https://rpc.edu-chain.raas.gelato.cloud',
    blockExplorerUrl: 'https://educhain.blockscout.com/'
  },
  {
    id: 656476,
    hexId: '0xA045C',
    name: 'EDU Chain Testnet',
    icon: '/chains/educhain.png',
    symbol: 'EDU',
    rpcUrl: 'https://open-campus-codex-sepolia.drpc.org/',
    blockExplorerUrl: 'https://opencampus-codex.blockscout.com/'
  },
  {
    id: 28122024,
    hexId: '0x1AD1BA8',
    name: 'Ancient8 Testnet',
    icon: '/chains/ancient8.png',
    symbol: 'ETH',
    rpcUrl: 'https://rpcv2-testnet.ancient8.gg/',
    blockExplorerUrl: 'https://ancient8.testnet.routescan.io/',
  },
  {
    id: 12227332,
    hexId: '0xBA9304',
    name: 'NeoX Testnet',
    icon: '/chains/neox.png',
    symbol: 'GAS',
    rpcUrl: 'https://neoxt4seed1.ngd.network/',
    blockExplorerUrl: 'https://xt4scan.ngd.network/'
  },
  {
    id: 5003,
    hexId: '0x138B',
    name: 'Mantle Sepolia Testnet',
    icon: '/chains/mantle.png',
    symbol: 'MNT',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    blockExplorerUrl: 'https://explorer.sepolia.mantle.xyz'
  },
  {
    id: 1001,
    hexId: '0x3E9',
    name: 'KAIA Testnet',
    icon: '/chains/kaia.png',
    symbol: 'KAIA',
    rpcUrl: 'https://kaia-kairos.blockpi.network/v1/rpc/public',
    blockExplorerUrl: 'https://kairos.kaiascope.com/',
  },
  {
    id: 59141,
    hexId: '0xE705',
    name: 'Linea Sepolia',
    icon: '/chains/linea.png',
    symbol: 'LineaETH',
    rpcUrl: 'https://linea-sepolia.infura.io',
    blockExplorerUrl: 'https://sepolia.lineascan.build'
  },
  {
    id: 66665,
    hexId: '0x10469',
    name: 'Creator Chain Testnet',
    icon: '/chains/creator.png',
    symbol: 'CETH',
    rpcUrl: 'https://66665.rpc.thirdweb.com',
    blockExplorerUrl: 'https://explorer.creatorchain.io'
  },
] as const

const ChainSelector = () => {
  const { isConnected } = useWallet()
  const [currentChainId, setCurrentChainId] = useState<number | null>(null)
  const [isSwitching, setIsSwitching] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const handleSwitchNetwork = async (chainData: typeof supportedChains[number]) => {
    if (!window.ethereum || !isConnected || isSwitching) return

    setIsSwitching(true)
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainData.hexId }],
      })
      setIsDropdownOpen(false)
    } catch (switchError: unknown) {
      if ((switchError as { code: number }).code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainData.hexId,
                chainName: chainData.name,
                nativeCurrency: {
                  name: chainData.symbol,
                  symbol: chainData.symbol,
                  decimals: 18
                },
                rpcUrls: [chainData.rpcUrl],
                blockExplorerUrls: [chainData.blockExplorerUrl]
              }
            ]
          })
          setIsDropdownOpen(false)
        } catch (addError) {
          console.error('Error adding chain:', addError)
        }
      }
    } finally {
      setIsSwitching(false)
    }
  }

  useEffect(() => {
    const getChainId = async () => {
      if (window.ethereum && isConnected) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          setCurrentChainId(parseInt(chainId, 16))
        } catch (error) {
          console.error('Error getting chain ID:', error)
        }
      }
    }

    getChainId()

    const handleChainChanged = (chainId: string) => {
      setCurrentChainId(parseInt(chainId, 16))
      window.location.reload()
    }

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [isConnected])

  if (!isConnected) return null

  const currentChain = supportedChains.find(c => c.id === currentChainId) || supportedChains[0]

  const mobileDropdownVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  const desktopDropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        className="flex items-center justify-between space-x-2 px-3 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]/30 hover:bg-[rgb(var(--card-hover))] transition-colors w-full md:w-auto min-w-[120px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-label="Select blockchain network"
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 relative flex-shrink-0">
            <Image
              src={currentChain.icon}
              alt={currentChain.name}
              fill
              className="rounded-full object-contain"
            />
          </div>
          <span className="text-[rgb(var(--foreground))] font-medium text-sm">
            {isMobile ? currentChain.symbol : currentChain.name}
          </span>
        </div>
        <ChevronDownIcon 
          className={`w-4 h-4 text-[rgb(var(--foreground))] transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isDropdownOpen && (
          isMobile ? (
            // Mobile Dropdown - Improved scrollable design
            <motion.div
              className="fixed inset-x-0 top-16 bottom-0 z-50 bg-[rgb(var(--background))]/95 backdrop-blur-xl"
              variants={mobileDropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col h-full">
                <div className="px-4 py-3 border-b border-[rgb(var(--border))]/30">
                  <h3 className="text-[rgb(var(--foreground))] font-medium text-lg">Select Network</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="px-4 py-2 space-y-2">
                    {supportedChains.map((chain) => (
                      <motion.button
                        key={chain.id}
                        onClick={() => handleSwitchNetwork(chain)}
                        className={`w-full px-4 py-3 flex items-center space-x-3 rounded-xl border ${
                          chain.id === currentChainId 
                            ? 'border-[rgb(var(--primary))]/30 bg-[rgb(var(--primary))]/5 text-[rgb(var(--primary))]' 
                            : 'border-transparent text-[rgb(var(--muted-foreground))] active:bg-[rgb(var(--primary))]/5'
                        } ${isSwitching ? 'opacity-50' : ''}`}
                        disabled={isSwitching}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-8 h-8 relative flex-shrink-0">
                          <Image
                            src={chain.icon}
                            alt={chain.name}
                            fill
                            className="rounded-full object-contain"
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-base font-medium">{chain.name}</div>
                          <div className="text-sm opacity-60">{chain.symbol}</div>
                        </div>
                        {chain.id === currentChainId && (
                          <motion.div
                            className="w-2 h-2 rounded-full bg-[rgb(var(--primary))]"
                            layoutId="activeChain"
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 border-t border-[rgb(var(--border))]/30">
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full py-3 px-4 rounded-xl bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] font-medium active:bg-[rgb(var(--primary))]/20"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            // Desktop Dropdown
            <motion.div
              variants={desktopDropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-64 rounded-xl bg-[rgb(var(--card))]/95 backdrop-blur-xl border border-[rgb(var(--border))]/30 shadow-xl overflow-hidden z-50"
            >
              <div className="py-2 max-h-96 overflow-y-auto scrollbar-hide">
                {supportedChains.map((chain) => (
                  <motion.button
                    key={chain.id}
                    onClick={() => handleSwitchNetwork(chain)}
                    className={`w-full px-4 py-2 flex items-center space-x-3 ${
                      chain.id === currentChainId ? 'text-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5' : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--primary))]/10'
                    } ${isSwitching ? 'opacity-50' : ''}`}
                    whileHover={{ x: 4 }}
                    disabled={isSwitching}
                  >
                    <div className="w-6 h-6 relative flex-shrink-0">
                      <Image
                        src={chain.icon}
                        alt={chain.name}
                        fill
                        className="rounded-full object-contain"
                      />
                    </div>
                    <span className="flex-1 text-left text-sm">{chain.name}</span>
                    {chain.id === currentChainId && (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-[rgb(var(--primary))]"
                        layoutId="activeChain"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  )
}

export default ChainSelector
// hooks/useChainInfo.ts

import { useEffect, useState } from 'react'
import { supportedChains } from '@/components/ChainSelector'

export const useChainInfo = () => {
  const [currentChainId, setCurrentChainId] = useState<number | null>(null)

  useEffect(() => {
    const getChainId = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          setCurrentChainId(parseInt(chainId, 16))
        } catch (error) {
          console.error('Error getting chain ID:', error)
        }
      }
    }

    getChainId()

    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId: string) => {
        setCurrentChainId(parseInt(chainId, 16))
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {})
      }
    }
  }, [])

  const currentChain = supportedChains.find(c => c.id === currentChainId) || supportedChains[0]

  return {
    currentChain,
    chainId: currentChainId
  }
}

export type { ChainInfo } from '@/components/ChainSelector'
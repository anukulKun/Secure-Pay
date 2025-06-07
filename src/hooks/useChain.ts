import { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';

export interface ChainInfo {
  chainId: number | undefined;
  nativeToken: string;
  chainName: string;
}

// Map of chain IDs to their native tokens
const TOKEN_MAP: Record<number, string> = {
  1: "ETH", // Ethereum
  5: "ETH", // Goerli
  137: "MATIC", // Polygon
  80001: "MATIC", // Mumbai
  56: "BNB", // BSC
  97: "BNB", // BSC Testnet
  10: "ETH", // Optimism
  420: "ETH", // Optimism Goerli
  42161: "ETH", // Arbitrum
  421613: "ETH", // Arbitrum Goerli
  43114: "AVAX", // Avalanche
  43113: "AVAX", // Fuji
  250: "FTM", // Fantom
  4002: "FTM", // Fantom Testnet
  100: "XDAI", // Gnosis
  42220: "CELO", // Celo
  1313161554: "ETH", // Aurora
  1284: "GLMR", // Moonbeam
  592: "ASTR", // Astar
  1088: "METIS", // Metis
  324: "ETH", // zkSync Era
  59144: "ETH", // Linea
  534352: "ETH", // Scroll
  8453: "ETH", // Base
  84531: "ETH", // Base Goerli
  42170: "ETH", // Arbitrum Nova
  12227332: "GAS", // NeoX Testnet
  656476: "EDU", // EduChain Testnet
  41923: "EDU", // Educhain Mainnet
  1001: "KAIA", // KAIA Testnet
  41: "TLOS", // Telos Testnet
  28122024: "ETH", // Ancient8 Testnet 
  5003: "MNT", // Mantle Testnet
  59141: "ETH", // Linea Testnet
  4157: "XFI", // CrossFi Testnet
  66665: "CETH", // Creator Testnet
  5201420: "ETN", // Electroneum Testnet
  52014: "ETN", // Electroneum Mainnet
};

// Map of chain IDs to their names
const CHAIN_NAME_MAP: Record<number, string> = {
  1: "Ethereum",
  5: "Goerli",
  137: "Polygon",
  80001: "Mumbai",
  56: "Binance Smart Chain",
  97: "BSC Testnet",
  10: "Optimism",
  420: "Optimism Goerli",
  42161: "Arbitrum",
  421613: "Arbitrum Goerli",
  43114: "Avalanche",
  43113: "Fuji",
  250: "Fantom",
  4002: "Fantom Testnet",
  100: "Gnosis",
  42220: "Celo",
  1313161554: "Aurora",
  1284: "Moonbeam",
  592: "Astar",
  1088: "Metis",
  324: "zkSync Era",
  59144: "Linea",
  534352: "Scroll",
  8453: "Base",
  84531: "Base Goerli",
  42170: "Arbitrum Nova",
  12227332: "NeoX Testnet",
  656476: "EduChain Testnet",
  41923: "Educhain Mainnet",
  1001: "KAIA Testnet",
  41: "Telos Testnet",
  28122024: "Ancient8 Testnet",
  5003: "Mantle Testnet",
  59141: "Linea Testnet",
  4157: "CrossFi Testnet",
  66665: "Creator Testnet",
  5201420: "Electroneum Testnet",
  52014: "Electroneum Mainnet",
};

/**
 * Hook to provide chain-specific information
 */
export function useChain(): ChainInfo {
  // Use the wallet context directly
  const wallet = useWallet();
  const [chainInfo, setChainInfo] = useState<ChainInfo>({
    chainId: undefined,
    nativeToken: "ETH", 
    chainName: "Unknown Chain"
  });

  useEffect(() => {
    // Type-safe approach to accessing window.ethereum
    const getChainInfo = () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Safe access with type assertion
          const ethereum = window.ethereum as any;
          if (ethereum && ethereum.chainId) {
            const chainId = parseInt(ethereum.chainId, 16);
            setChainInfo({
              chainId,
              nativeToken: TOKEN_MAP[chainId] || "ETH", 
              chainName: CHAIN_NAME_MAP[chainId] || "Unknown Chain"
            });
          }
        } catch (error) {
          console.error("Error accessing ethereum provider:", error);
        }
      }
    };

    // Initial check
    getChainInfo();

    // Set up event listener for chain changes if ethereum is available
    if (typeof window !== 'undefined' && window.ethereum) {
      const ethereum = window.ethereum as any;
      const handleChainChanged = (chainId: string) => {
        const id = parseInt(chainId, 16);
        setChainInfo({
          chainId: id,
          nativeToken: TOKEN_MAP[id] || "ETH", 
          chainName: CHAIN_NAME_MAP[id] || "Unknown Chain"
        });
      };

      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [wallet.isConnected]);

  return chainInfo;
}

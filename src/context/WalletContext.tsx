// context/WalletContext.tsx

'use client'

import React, { ReactNode, useEffect, useState } from 'react';
import { createConfig, WagmiProvider, useAccount, useBalance as useWagmiBalance } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { http } from 'viem';
import { 
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
  darkTheme 
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

type ExtendedProvider = ethers.providers.ExternalProvider & {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
};

// Define chains
const neoXTestnet = {
  id: 12227332,
  name: 'NeoX Testnet',
  network: 'neoxtestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'GAS',
    symbol: 'GAS',
  },
  rpcUrls: {
    default: {
      http: ['https://neoxt4seed1.ngd.network/']
    },
    public: {
      http: ['https://neoxt4seed1.ngd.network/']
    }
  },
  blockExplorers: {
    default: {
      name: 'NeoX Scan',
      url: 'https://xt4scan.ngd.network/'
    }
  },
  testnet: true,
} as const;

const eduChainMainnet = {
  id: 41923,
  name: 'EDU Chain',
  network: 'educhain',
  nativeCurrency: {
    decimals: 18,
    name: 'EDU',
    symbol: 'EDU',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.edu-chain.raas.gelato.cloud']
    },
    public: {
      http: ['https://rpc.edu-chain.raas.gelato.cloud']
    }
  },
  blockExplorers: {
    default: {
      name: 'EDU Chain Explorer',
      url: 'https://educhain.blockscout.com'
    }
  },
  testnet: false,
} as const;

const eduChainTestnet = {
  id: 656476,
  name: 'EDU Chain Testnet',
  network: 'educhaintestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'EDU',
    symbol: 'EDU',
  },
  rpcUrls: {
    default: {
      http: ['https://open-campus-codex-sepolia.drpc.org/']
    },
    public: {
      http: ['https://open-campus-codex-sepolia.drpc.org/']
    }
  },
  blockExplorers: {
    default: {
      name: 'EDU Chain Explorer',
      url: 'https://opencampus-codex.blockscout.com/'
    }
  },
  testnet: true,
} as const;

const kaiatestnet = {
  id: 1001,
  hexId: '0x3E9',
  name: 'KAIA Testnet',
  network: 'kaiatestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'KAIA',
    symbol: 'KAIA',
  },
  rpcUrls: {
    default: {
      http: ['https://kaia-kairos.blockpi.network/v1/rpc/public']
    },
    public: {
      http: ['https://kaia-kairos.blockpi.network/v1/rpc/public']
    }
  },
  blockExplorers: {
    default: {
      name: 'KAIA Testnet Explorer',
      url: 'https://kairos.kaiascope.com/'
    }
  },
  testnet: true,
} as const;

const ancient8Testnet = {
  id: 28122024,
  hexId: '0x1AD1BA8',
  name: 'Ancient8 Testnet',
  network: 'ancient8testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpcv2-testnet.ancient8.gg/']
    },
    public: {
      http: ['https://rpcv2-testnet.ancient8.gg/']
    }
  },
  blockExplorers: {
    default: {
      name: 'Ancient8 Testnet Explorer',
      url: 'https://ancient8.testnet.routescan.io/'
    }
  },
  testnet: true,
} as const;

const mantleSepoliaTestnet = {
  id: 5003,
  hexId: '0x138B',
  name: 'Mantle Sepolia Testnet',
  network: 'mantlesepoliatestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz']
    },
    public: {
      http: ['https://rpc.sepolia.mantle.xyz']
    }
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Testnet Explorer',
      url: 'https://explorer.sepolia.mantle.xyz/'
    }
  },
  testnet: true,
} as const;

const creatorChainTestnet = {
  id: 66665,
  name: 'Creator Chain Testnet',
  network: 'creatorchaintestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CETH',
    symbol: 'CETH',
  },
  rpcUrls: {
    default: {
      http: ['https://66665.rpc.thirdweb.com']
    },
    public: {
      http: ['https://66665.rpc.thirdweb.com']
    }
  },
  blockExplorers: {
    default: {
      name: 'Creator Chain Explorer',
      url: 'https://explorer.creatorchain.io'
    }
  },
  testnet: true,
} as const;

const lineaSepoliaTestnet = {
  id: 59141,
  hexId: '0xE705',
  name: 'Linea Sepolia Testnet',
  network: 'lineasepoliatestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'LineaETH',
    symbol: 'LineaETH',
  },
  rpcUrls: {
    default: {
      http: ['https://linea-sepolia.infura.io']
    },
    public: {
      http: ['https://linea-sepolia.infura.io']
    }
  },
  blockExplorers: {
    default: {
      name: 'Linea Sepolia Explorer',
      url: 'https://sepolia.lineascan.build'
    }
  },
  testnet: true,
} as const;

const electroneumMainnet = {
  id: 52014,
  hexId: '0xCB2E',
  name: 'Electroneum Mainnet',
  network: 'electroneummainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETN',
    symbol: 'ETN',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/electroneum']
    },
    public: {
      http: ['https://rpc.ankr.com/electroneum']
    }
  },
  blockExplorers: {
    default: {
      name: 'Electroneum Explorer',
      url: 'https://blockexplorer.electroneum.com/'
    }
  },
  testnet: false,
} as const;

const electroneumTestnet = {
  id: 5201420,
  hexId: '0x4F5E0C',
  name: 'Electroneum Testnet',
  network: 'electroneumtestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETN',
    symbol: 'ETN',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/electroneum_testnet']
    },
    public: {
      http: ['https://rpc.ankr.com/electroneum_testnet']
    }
  },
  blockExplorers: {
    default: {
      name: 'Electroneum Testnet Explorer',
      url: 'https://blockexplorer.thesecurityteam.rocks/'
    }
  },
  testnet: true,
} as const;

const chains = [electroneumMainnet, electroneumTestnet, neoXTestnet, eduChainTestnet, kaiatestnet, ancient8Testnet, mantleSepoliaTestnet, lineaSepoliaTestnet, creatorChainTestnet, eduChainMainnet] as const; 

const projectId = 'b8ad206ba9492e6096fa0aa0f868586c';

const { wallets } = getDefaultWallets({
  appName: 'SecurePay',
  projectId,
});

const connectors = connectorsForWallets([
  ...wallets,
], {
  appName: 'SecurePay',
  projectId,
});

const wagmiConfig = createConfig({
  connectors,
  chains,
  transports: {
    [electroneumMainnet.id]: http(),
    [electroneumTestnet.id]: http(),
    [eduChainTestnet.id]: http(),
    [ancient8Testnet.id]: http(),
    [neoXTestnet.id]: http(),
    [kaiatestnet.id]: http(),
    [mantleSepoliaTestnet.id]: http(),
    [lineaSepoliaTestnet.id]: http(),
    [creatorChainTestnet.id]: http(),
    [eduChainMainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

interface WalletContextType {
  address: string | null;
  balance: string | null;
  signer: ethers.Signer | null;
  isConnected: boolean;
}

const WalletContext = React.createContext<WalletContextType>({
  address: null,
  balance: null,
  signer: null,
  isConnected: false,
});

function WalletState({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<WalletContextType>({
    address: null,
    balance: null,
    signer: null,
    isConnected: false,
  });

  const { address, isConnected } = useAccount();
  const { data: wagmiBalance } = useWagmiBalance({
    address: address as `0x${string}` | undefined,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initializeWallet = async () => {
      if (typeof window !== 'undefined' && window.ethereum && address) {
        try {
          const provider = new ethers.providers.Web3Provider(
            window.ethereum as unknown as ExtendedProvider
          );
          
          const signer = provider.getSigner();
          
          let balance: string;
          if (wagmiBalance) {
            balance = ethers.utils.formatEther(wagmiBalance.value.toString());
          } else {
            const ethersBalance = await provider.getBalance(address);
            balance = ethers.utils.formatEther(ethersBalance);
          }
          
          setState({
            address,
            balance,
            signer,
            isConnected: true,
          });
        } catch (error) {
          console.error('Error initializing wallet:', error);
          setState({
            address: null,
            balance: null,
            signer: null,
            isConnected: false,
          });
        }
      } else if (!address) {
        setState({
          address: null,
          balance: null,
          signer: null,
          isConnected: false,
        });
      }
    };

    const handleAccountsChanged = () => {
      initializeWallet();
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    initializeWallet();

    const ethereum = window.ethereum as unknown as ExtendedProvider;
    if (ethereum?.on) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (ethereum?.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [mounted, address, isConnected, wagmiBalance]);

  useEffect(() => {
    if (wagmiBalance && address && isConnected) {
      try {
        const formattedBalance = ethers.utils.formatEther(wagmiBalance.value.toString());
        setState(prev => ({
          ...prev,
          balance: formattedBalance,
        }));
      } catch (error) {
        console.error('Error formatting balance:', error);
      }
    }
  }, [wagmiBalance, address, isConnected]);

  if (!mounted) return null;

  return (
    <WalletContext.Provider value={state}>
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#22c55e',
            accentColorForeground: 'white',
          })}
        >
          <WalletState>{children}</WalletState>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useWallet() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';
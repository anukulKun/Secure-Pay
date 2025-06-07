// compoenents/ConnectWallet.tsx

'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';

const ConnectWallet = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <motion.button
                    onClick={openConnectModal}
                    className="relative flex items-center space-x-2 px-4 py-2 rounded-xl font-medium overflow-hidden group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300 group-hover:opacity-100 opacity-90" />
                    <span className="relative text-black">Connect Wallet</span>
                  </motion.button>
                );
              }

              if (chain.unsupported) {
                return (
                  <motion.button
                    onClick={openChainModal}
                    className="relative flex items-center space-x-2 px-4 py-2 rounded-xl font-medium overflow-hidden group bg-red-500"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="relative text-white">Wrong Network</span>
                  </motion.button>
                );
              }

              return (
                <motion.button
                  onClick={openAccountModal}
                  className="relative flex items-center space-x-2 px-4 py-2 rounded-xl font-medium overflow-hidden group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300 group-hover:opacity-100 opacity-90" />
                  <span className="relative text-black">
                    {account.displayName}
                  </span>
                </motion.button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default ConnectWallet;
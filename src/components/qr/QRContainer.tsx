// components/qr/QRContainer.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ShareIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface QRContainerProps {
  children: React.ReactNode;
  onShare?: () => void;
  onDownload?: () => void;
}

const QRContainer: React.FC<QRContainerProps> = ({ 
  children, 
  onShare, 
  onDownload 
}) => {
  return (
    <div className="relative p-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-lg" />
      
      <div className="relative bg-black/90 p-4 rounded-lg">
      {children}
      
      {/* Action buttons */}
      <div className="absolute -right-12 top-0 flex flex-col space-y-2">
        {onShare && (
        <motion.button
          onClick={onShare}
          className="p-2 bg-black/80 rounded-xl border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ShareIcon className="w-5 h-5" />
        </motion.button>
        )}
        
        {onDownload && (
        <motion.button
          onClick={onDownload}
          className="p-2 bg-black/80 rounded-xl border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
        </motion.button>
        )}
      </div>
      </div>
    </div>
  );
};

export default QRContainer;
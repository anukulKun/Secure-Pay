import React, { useRef, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { ShareIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';

interface ProfileQRProps {
  username: string;
  address: string;
  onClose?: () => void;
}

const ProfileQR: React.FC<ProfileQRProps> = ({ username, address, onClose }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  const { resolvedTheme, systemTheme } = useTheme();
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [qrFgColor, setQrFgColor] = useState('#10B981');
  const [mounted, setMounted] = useState(false);
  
  // After mounting, we can safely check the theme
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Force update QR colors when theme changes
  useEffect(() => {
    if (mounted) {
      // Force detect theme by checking both theme API and document element
      const htmlEl = document.documentElement;
      const isDarkMode = htmlEl.classList.contains('dark') || 
                        window.matchMedia('(prefers-color-scheme: dark)').matches || 
                        resolvedTheme === 'dark' || 
                        systemTheme === 'dark';
      
      // Set colors based on detected theme
      setQrBgColor(isDarkMode ? '#111111' : '#ffffff');
      setQrFgColor('#10B981'); // Keep foreground color consistent
      
      console.log('Theme detection:', {
        htmlClass: htmlEl.classList.contains('dark'),
        mediaQuery: window.matchMedia('(prefers-color-scheme: dark)').matches,
        resolvedTheme,
        systemTheme,
        isDarkMode,
        bgColor: isDarkMode ? '#111111' : '#ffffff'
      });
    }
  }, [resolvedTheme, systemTheme, mounted]);

  // Add a manual check for theme changes
  useEffect(() => {
    const checkTheme = () => {
      const htmlEl = document.documentElement;
      const isDarkMode = htmlEl.classList.contains('dark');
      setQrBgColor(isDarkMode ? '#111111' : '#ffffff');
      console.log('Manual theme check:', isDarkMode);
    };
    
    // Check immediately and set up observer
    checkTheme();
    
    // Watch for class changes on html element
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, [mounted]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const qrData = JSON.stringify({
    app: "SecurePay",
    username,
    address,
    type: "payment"
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pay ${username} on SecurePay`,
          text: `Send payment to ${username} using SecurePay`,
          url: `https://securepay.com/transfer?to=${address}`
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        // Use current QR background color
        ctx.fillStyle = qrBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `securepay-${username}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Format address for display (truncate if needed)
  const formatAddress = (addr: string) => {
    if (isMobile && addr.length > 20) {
      return `${addr.slice(0, 10)}...${addr.slice(-10)}`;
    }
    return addr;
  };

  // Determine QR code size based on viewport
  const getQRSize = () => {
    if (isMobile) return 180;
    return 220;
  };
  
  // Show a simple loading state if not mounted yet to avoid theme flashing
  if (!mounted) {
    return <div className="p-8 flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[rgb(var(--primary))]"></div>
    </div>;
  }

  return (
    <div className="w-full flex flex-col sm:flex-row items-center sm:items-start gap-6">
      {/* Left side - QR Code */}
      <div className="flex-shrink-0 flex justify-center">
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-[rgb(var(--primary))]/20 via-[rgb(var(--primary))]/30 to-[rgb(var(--primary))]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <motion.div
            className="relative p-3 rounded-2xl border border-[rgb(var(--border))]/30 shadow-lg"
            ref={qrRef}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ backgroundColor: qrBgColor }}
          >
            <QRCodeSVG
              value={qrData}
              size={getQRSize()}
              level="H"
              includeMargin={true}
              bgColor={qrBgColor}
              fgColor={qrFgColor}
              imageSettings={{
                src: "/logo.png",
                x: undefined,
                y: undefined,
                height: isMobile ? 25 : 35,
                width: isMobile ? 25 : 35,
                excavate: true,
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Right side - Content */}
      <div className="flex flex-col flex-1 justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2 mb-4 text-center sm:text-left"
        >
          <h3 className="text-xl font-bold bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--primary-light))] text-transparent bg-clip-text">
            Payment QR
          </h3>
          <div className="flex flex-col gap-1">
            <p className="text-md text-[rgb(var(--primary))] font-semibold">{username}</p>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">Scan to send payment</p>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="flex justify-center sm:justify-start gap-4">
            {typeof navigator.share === 'function' && (
              <motion.button
                onClick={handleShare}
                className="p-3 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))]/30 text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/20 transition-all duration-300 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShareIcon className="w-5 h-5" />
              </motion.button>
            )}

            <motion.button
              onClick={handleDownload}
              className="p-3 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))]/30 text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/20 transition-all duration-300 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="px-3 py-2 bg-[rgb(var(--background))]/40 rounded-xl border border-[rgb(var(--border))]/30 max-w-full overflow-hidden">
            <div className="text-xs text-[rgb(var(--muted-foreground))] text-center sm:text-left overflow-auto scrollbar-hide">
              <span className="inline-block whitespace-normal break-all">{address}</span>
            </div>
          </div>

          {onClose && (
            <motion.button
              onClick={onClose}
              className="w-full px-6 py-2 bg-gradient-to-r from-[rgb(var(--primary))]/20 to-[rgb(var(--primary-light))]/20 text-[rgb(var(--primary))] rounded-xl hover:from-[rgb(var(--primary))]/30 hover:to-[rgb(var(--primary-light))]/30 transition-all duration-300 shadow-lg text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileQR;
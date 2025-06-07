'use client'

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, Variants, useAnimation, useInView } from 'framer-motion';
import { 
  ShieldCheckIcon, CurrencyDollarIcon, UserCircleIcon, 
  ArrowPathIcon, CheckCircleIcon, 
  BanknotesIcon, UsersIcon, SparklesIcon,
  ChartBarIcon, WalletIcon, FireIcon,
  QrCodeIcon, DevicePhoneMobileIcon, 
  ArrowRightIcon, ScissorsIcon,
  SunIcon, MoonIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useChain } from '@/hooks/useChain';

// Animation variants
const fadeIn = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] } 
  }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

const iconFloat = {
  initial: { y: 0 },
  animate: { 
    y: [-5, 5, -5],
    transition: { 
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" 
    } 
  }
};

// Improved theme toggle component with animation
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDarkMode = theme === 'dark';

  return (
    <motion.button
      onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
      className="fixed top-6 right-6 z-50 p-3 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-lg border border-white/10 dark:border-white/10 shadow-lg group"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        <motion.div
          initial={{ scale: isDarkMode ? 1 : 0 }}
          animate={{ scale: isDarkMode ? 1 : 0, rotate: isDarkMode ? 0 : 180 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center text-yellow-300"
        >
          <SunIcon className="w-6 h-6" />
        </motion.div>
        
        <motion.div
          initial={{ scale: isDarkMode ? 0 : 1 }}
          animate={{ scale: isDarkMode ? 0 : 1, rotate: isDarkMode ? -180 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center text-blue-300"
        >
          <MoonIcon className="w-6 h-6" />
        </motion.div>
      </div>
      <span className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-black/70 dark:bg-white/10 text-white dark:text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md">
        {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
      </span>
    </motion.button>
  );
};

const FloatingObjects = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 md:w-8 md:h-8 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0.1
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
          style={{
            background: `radial-gradient(circle, rgba(${Math.random() * 100 + 100}, 255, ${Math.random() * 100 + 100}, 0.3) 0%, rgba(0,255,0,0) 70%)`
          }}
        />
      ))}
    </div>
  );
};

const Hero = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const { chainId, nativeToken } = useChain();
  
  return (
    <motion.section
      className="relative min-h-[100vh] flex items-center justify-center text-center overflow-hidden px-4"
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <FloatingObjects />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-30 dark:opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-black dark:via-blue-950/30 dark:to-black" />
      
      <motion.div style={{ y, opacity }} className="relative z-10 w-full max-w-6xl mx-auto">
        <motion.div
          className="mb-8 inline-block"
          variants={iconFloat}
          initial="initial"
          animate="animate"
        >
          <div className="bg-white/30 dark:bg-black/30 p-4 md:p-8 rounded-3xl backdrop-blur-xl border border-gray-200 dark:border-blue-500/20 hover:border-blue-500/40 transition-all duration-500 shadow-sm">
            <ShieldCheckIcon className="w-16 h-16 md:w-24 md:h-24 text-blue-500 dark:text-blue-400" />
          </div>
        </motion.div>

        <motion.h1 
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 tracking-tight"
          variants={fadeIn}
        >
          <span className="bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-600 dark:from-blue-400 dark:via-emerald-300 dark:to-blue-500 text-transparent bg-clip-text">
            SecurePay
          </span>
        </motion.h1>

        <motion.p 
          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-8 md:mb-12 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto font-light px-4"
          variants={fadeIn}
        >
          Smart, Secure Crypto Transfers With Built-in Escrow Protection
        </motion.p>

        <motion.div 
          className="flex justify-center px-4"
          variants={fadeIn}
        >
          <Link href="/dashboard/transfer" className="group relative bg-blue-500 text-black px-8 md:px-12 py-4 md:py-5 rounded-xl md:rounded-2xl font-semibold text-lg md:text-xl transition-all duration-300 flex items-center justify-center space-x-3">
            <span className="relative z-10">Transfer Now</span>
            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-blue-400 blur-md group-hover:opacity-70 transition-opacity opacity-0" />
          </Link>
        </motion.div>

        <motion.div 
          className="mt-8 md:mt-16 flex justify-center gap-8 md:gap-16 flex-wrap px-4"
          variants={fadeIn}
        >
          {[
            { icon: ShieldCheckIcon, text: "Funds Secure Until Claimed" },
            { icon: QrCodeIcon, text: "QR Scan & Pay" },
            { icon: ScissorsIcon, text: "Split Bills Easily" }
          ].map((item, i) => (
            <motion.div 
              key={i}
              className="flex items-center space-x-2 md:space-x-3 text-sm md:text-base text-gray-600 dark:text-gray-400 group"
              whileHover={{ scale: 1.05 }}
            >
              <item.icon className="w-5 h-5 md:w-6 md:h-6 text-blue-500 group-hover:text-blue-600 dark:text-blue-400 dark:group-hover:text-blue-300 transition-colors" />
              <span className="group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
    </motion.section>
  );
};

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;
  const isDarkMode = theme === 'dark';

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 px-4 transition-all duration-300 ${
        scrolled 
          ? 'py-3 bg-white/80 dark:bg-black/80 backdrop-blur-lg shadow-md' 
          : 'py-5 bg-transparent'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo and name on the left */}
        <Link href="/" className="flex items-center space-x-2">
          <ShieldCheckIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-emerald-500 dark:from-blue-400 dark:to-emerald-400 text-transparent bg-clip-text">
            SecurePay
          </span>
        </Link>

        {/* Launch app and theme toggle on the right */}
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard" 
            className="bg-blue-500 hover:bg-blue-600 text-black font-medium px-4 py-2 rounded-lg flex items-center space-x-1 transition-colors"
          >
            <span>Launch App</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>

          <button
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? (
              <SunIcon className="w-5 h-5 text-yellow-500" />
            ) : (
              <MoonIcon className="w-5 h-5 text-blue-500" />
            )}
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

const ChainSlider = () => {
  const chains = [
    { name: 'Electroneum', icon: '/chains/electroneum.png' },
    { name: 'NeoX', icon: '/chains/neox.png' },
    { name: 'EduChain', icon: '/chains/educhain.png' },
    { name: 'Ancient8', icon: '/chains/ancient8.png' },
    { name: 'Mantle', icon: '/chains/mantle.png' },
    { name: 'Kaia', icon: '/chains/kaia.png' },
    { name: 'Linea', icon: '/chains/linea.png' },
    { name: 'Creator', icon: '/chains/creator.png' },
  ];

  return (
    <section id="chains" className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-4 mb-10">
        <motion.h2 
          className="text-3xl md:text-5xl font-bold mb-4 text-center"
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <span className="bg-gradient-to-r from-blue-500 to-emerald-500 dark:from-blue-400 dark:to-emerald-500 text-transparent bg-clip-text">
            Multi-Chain Support
          </span>
        </motion.h2>
        
        <motion.p
          className="text-center text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8"
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          Send and receive funds seamlessly across multiple blockchain networks, all with the same secure interface
        </motion.p>
      </div>

      <div className="slider-container">
        <div className="slider">
          {/* Generate multiple copies for infinite scrolling effect */}
          {[...Array(4)].map((_, copyIndex) => (
            <React.Fragment key={`copy-${copyIndex}`}>
              {chains.map((chain, index) => (
                <div key={`chain-${copyIndex}-${index}`} className="slide">
                  <div className="logo-wrapper group">
                    <Image
                      src={chain.icon}
                      alt={chain.name}
                      width={80}
                      height={80}
                      className="logo-image transition-all duration-300 filter grayscale group-hover:grayscale-0 group-hover:scale-110"
                    />
                    <div className="logo-name opacity-70 group-hover:opacity-100 group-hover:text-blue-500 dark:group-hover:text-blue-400">
                      {chain.name}
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .slider-container {
          position: relative;
          overflow: hidden;
          padding: 20px 0;
          width: 100%;
        }
        
        .slider-container::before,
        .slider-container::after {
          content: '';
          position: absolute;
          top: 0;
          width: 200px;
          height: 100%;
          z-index: 2;
          pointer-events: none;
        }
        
        .slider-container::before {
          left: 0;
          background: linear-gradient(to right, var(--slider-bg-start), var(--slider-bg-end));
        }
        
        .slider-container::after {
          right: 0;
          background: linear-gradient(to left, var(--slider-bg-start), var(--slider-bg-end));
        }
        
        .slider {
          display: flex;
          animation: scroll 60s linear infinite;
          width: fit-content;
        }
        
        .slider-container:hover .slider {
          animation-play-state: paused;
        }
        
        .slide {
          flex: 0 0 auto;
          width: 140px;
          box-sizing: border-box;
          padding: 0 10px;
        }
        
        .logo-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(128, 128, 128, 0.2);
          transition: all 0.3s ease;
          cursor: pointer;
          height: 120px;
        }
        
        .logo-wrapper:hover {
          border-color: rgba(74, 222, 128, 0.4);
          transform: translateY(-5px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .logo-image {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }
        
        .logo-name {
          margin-top: 8px;
          font-size: 14px;
          text-align: center;
          color: #6b7280;
          transition: all 0.3s ease;
        }
        
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-140px * ${chains.length}));
          }
        }

        :root {
          --slider-bg-start: rgba(255, 255, 255, 1);
          --slider-bg-end: rgba(255, 255, 255, 0);
        }

        :global(.dark) {
          --slider-bg-start: rgba(0, 0, 0, 1);
          --slider-bg-end: rgba(0, 0, 0, 0);
        }
      `}</style>
    </section>
  );
};

const TransferHighlight = () => {
  const { nativeToken } = useChain();
  
  return (
    <motion.section
      id="features"
      className="py-16 md:py-24 relative overflow-hidden"
      variants={stagger}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-black dark:via-blue-950/10 dark:to-black" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div 
            className="order-2 lg:order-1"
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-500 to-emerald-500 dark:from-blue-400 dark:to-emerald-500 text-transparent bg-clip-text">
                Secure Transfers
              </span>
            </h2>
            
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-8">
              Unlike traditional crypto payments, SecurePay holds your transfer in escrow until the recipient claims it. No more sending funds to the wrong address or worrying about scams.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="mt-1 p-2 bg-blue-500/10 rounded-lg">
                  <QrCodeIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">QR Upload & Scan</h3>
                  <p className="text-gray-600 dark:text-gray-400">Share payment links via QR code or scan to pay instantly on mobile. Perfect for in-person transactions.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="mt-1 p-2 bg-blue-500/10 rounded-lg">
                  <ArrowPathIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Refundable Payments</h3>
                  <p className="text-gray-600 dark:text-gray-400">Sent to the wrong person? Get your funds back instantly if they haven't been claimed yet.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="mt-1 p-2 bg-blue-500/10 rounded-lg">
                  <UserCircleIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Username Payments</h3>
                  <p className="text-gray-600 dark:text-gray-400">Send to memorable usernames instead of complicated wallet addresses. Simple and secure.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <Link href="/dashboard/transfer" className="inline-flex items-center space-x-2 bg-blue-500 text-black px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 group">
                <span>Try Secure Transfer</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            className="order-1 lg:order-2"
            variants={fadeIn}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-30" />
              <div className="relative bg-white/40 dark:bg-black/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-blue-500/30 shadow-xl">
                <div className="bg-white/70 dark:bg-black/70 rounded-xl overflow-hidden shadow-2xl">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-500/30 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    </div>
                    <div className="text-blue-600 dark:text-blue-400 text-sm">Secure Transfer</div>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-6 text-center">
                      <motion.div
                        className="inline-block"
                        variants={iconFloat}
                        initial="initial"
                        animate="animate"
                      >
                        <ShieldCheckIcon className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">Secure Transaction</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Funds held in escrow until claimed</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-black/50 p-4 rounded-lg border border-gray-100 dark:border-blue-500/20">
                        <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Recipient</div>
                        <div className="flex items-center justify-between">
                          <div className="text-blue-600 dark:text-blue-400">crypto.user</div>
                          <UserCircleIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-black/50 p-4 rounded-lg border border-gray-100 dark:border-blue-500/20">
                        <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Amount</div>
                        <div className="flex items-center justify-between">
                          <div className="text-blue-600 dark:text-blue-400">0.5 {nativeToken}</div>
                          <CurrencyDollarIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-black/50 p-4 rounded-lg border border-gray-100 dark:border-blue-500/20">
                        <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Message</div>
                        <div className="text-blue-600 dark:text-blue-400">Payment for design work</div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button className="w-full bg-blue-500 text-black py-3 rounded-lg font-semibold">
                        Confirm Transfer
                      </button>
                      <div className="mt-4 text-center text-gray-500 dark:text-gray-500 text-sm">
                        Refundable until claimed
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

const Footer = () => {
  return (
    <footer className="relative z-20 bg-gray-100 dark:bg-gray-800 py-16 mt-16 border-t-4 border-blue-500 dark:border-blue-400">
      <div className="container mx-auto px-4">
     
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} SecurePay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen text-gray-900 dark:text-white">
      <Navbar />
      
      {/* Main content area */}
      <main className="flex-grow">
        <Hero />
        <TransferHighlight />
        <ChainSlider />
      </main>
      
      {/* Footer - explicitly attached to the bottom */}
      <Footer />
    </div>
  );
};

export default LandingPage;

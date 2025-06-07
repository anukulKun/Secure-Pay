// components/qr/QRScanner.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCodeIcon, 
  XMarkIcon,
  PhotoIcon,
  CameraIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { isMobile } from 'react-device-detect';
import { Html5Qrcode } from 'html5-qrcode';
import { useTheme } from 'next-themes';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(isMobile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const cleanupScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await new Promise(resolve => setTimeout(resolve, 100)); // Give time for cleanup
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (error) {
      console.debug('Scanner cleanup error:', error);
    }
  }, []);

  const handleClose = useCallback(async () => {
    try {
      await cleanupScanner();
    } catch (error) {
      console.debug('Close error:', error);
    } finally {
      setIsOpen(false);
    }
  }, [cleanupScanner]);

  const handleSuccessfulScan = useCallback(async (data: string) => {
    try {
      await cleanupScanner();
    } catch (error) {
      console.debug('Scan cleanup error:', error);
    } finally {
      onScan(data);
      setIsOpen(false);
    }
  }, [onScan, cleanupScanner]);

  useEffect(() => {
    // Set default mode based on device
    setIsCameraMode(isMobile);
  }, []);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      if (isOpen && isCameraMode && isMobile) {
        try {
          await cleanupScanner();
          if (!mounted) return;

          const scanner = new Html5Qrcode("reader");
          scannerRef.current = scanner;

          const qrboxSize = Math.min(window.innerWidth, window.innerHeight) * 0.7;
          const qrboxWidth = Math.min(250, qrboxSize);
          const qrboxHeight = qrboxWidth;

          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: qrboxWidth, height: qrboxHeight },
              aspectRatio: 1.0
            },
            async (decodedText) => {
              if (!mounted) return;
              try {
                const parsedData = JSON.parse(decodedText);
                console.log("Scanned data:", parsedData);
                if (parsedData.app === "SecurePay" && parsedData.address) {
                  await handleSuccessfulScan(parsedData.address);
                }
              } catch {
                if (decodedText.startsWith('0x')) {
                  await handleSuccessfulScan(decodedText);
                }
              }
            },
            undefined
          );
        } catch (error) {
          console.error('Scanner error:', error);
          if (mounted) {
            onError?.('Failed to start camera');
            setIsCameraMode(false);
          }
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      cleanupScanner().catch(console.debug);
    };
  }, [isOpen, isCameraMode, handleSuccessfulScan, cleanupScanner, onError]);

  // Set up drag and drop functionality
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const preventDefault = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: DragEvent) => {
      preventDefault(e);
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      preventDefault(e);
      setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent) => {
      preventDefault(e);
      setIsDragging(true);
    };

    const handleDrop = (e: DragEvent) => {
      preventDefault(e);
      setIsDragging(false);
      
      const files = e.dataTransfer?.files;
      if (files?.length) {
        handleFileProcess(files[0]);
      }
    };

    dropArea.addEventListener('dragenter', handleDragEnter);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('drop', handleDrop);

    return () => {
      dropArea.removeEventListener('dragenter', handleDragEnter);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        try {
          const jsQR = (await import('jsqr')).default;
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          
          if (imageData) {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              try {
                const parsedData = JSON.parse(code.data);
                if (parsedData.app === "SecurePay" && parsedData.address) {
                  handleSuccessfulScan(parsedData.address);
                }
              } catch {
                if (code.data.startsWith('0x')) {
                  handleSuccessfulScan(code.data);
                } else {
                  onError?.('Invalid QR code format');
                }
              }
            } else {
              onError?.('No QR code found in image');
            }
          }
        } catch (error) {
          onError?.(error instanceof Error ? error.message : 'Failed to read QR code');
        }
        
        setIsProcessing(false);
      };

      img.onerror = () => {
        onError?.('Failed to load image');
        setIsProcessing(false);
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        }
      };
      reader.onerror = () => {
        onError?.('Failed to read file');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to process image');
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Theme aware button classes
  const getButtonClasses = (active: boolean) => {
    return `p-2 ${
      active 
        ? `bg-[rgb(var(--primary))]/20 text-[rgb(var(--primary))]` 
        : `text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--primary))]`
    }`;
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 p-4 bg-[rgb(var(--card))] backdrop-blur-xl rounded-full border border-[rgb(var(--border))]/30 text-[rgb(var(--primary))] shadow-lg shadow-[rgb(var(--primary))]/10 z-40 hover:bg-[rgb(var(--primary))]/10 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <QrCodeIcon className="w-6 h-6" />
      </motion.button>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-[rgb(var(--background))]/95 backdrop-blur-lg z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="p-4 flex justify-between items-center border-b border-[rgb(var(--border))]/30 bg-[rgb(var(--card))]/40">
              <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                {isMobile ? 'Scan QR Code' : 'Upload QR Code'}
              </h2>
              <div className="flex items-center space-x-4">
                {isMobile && (
                  <div className="flex rounded-lg overflow-hidden border border-[rgb(var(--border))]/30 bg-[rgb(var(--card))]/40">
                    <button
                      onClick={() => setIsCameraMode(true)}
                      className={getButtonClasses(isCameraMode)}
                    >
                      <CameraIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={async () => {
                        await cleanupScanner();
                        setIsCameraMode(false);
                        triggerFileInput();
                      }}
                      className={getButtonClasses(!isCameraMode)}
                    >
                      <PhotoIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
                >
                  <XMarkIcon className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4">
              {isMobile ? (
                isCameraMode ? (
                  <div className="w-full max-w-sm mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--primary))]/20 to-[rgb(var(--primary))]/20 rounded-2xl blur-xl" />
                    <div className="relative overflow-hidden rounded-xl border-2 border-[rgb(var(--border))]/30">
                      <div id="reader" className="w-full aspect-square bg-black"></div>
                      
                      {/* Scanner overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 border-2 border-[rgb(var(--primary))]/30 rounded-lg"></div>
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[rgb(var(--primary))] rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[rgb(var(--primary))] rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[rgb(var(--primary))] rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[rgb(var(--primary))] rounded-br-lg"></div>
                      </div>
                    </div>
                    <p className="text-center text-sm text-[rgb(var(--muted-foreground))] mt-4">
                      Position the QR code inside the square
                    </p>
                  </div>
                ) : (
                  <div 
                    className="w-full max-w-sm mx-auto flex flex-col items-center justify-center"
                    onClick={triggerFileInput}
                  >
                    <div className="mb-4">
                      <PhotoIcon className="w-16 h-16 text-[rgb(var(--primary))]/50" />
                    </div>
                    <p className="text-center text-[rgb(var(--foreground))] mb-2">Upload a QR code image</p>
                    <p className="text-center text-sm text-[rgb(var(--muted-foreground))] mb-4">
                      Tap to select an image from your device
                    </p>
                    <motion.button
                      onClick={triggerFileInput}
                      className="px-4 py-2 bg-[rgb(var(--primary))]/10 rounded-lg text-[rgb(var(--primary))] font-medium"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Select Image
                    </motion.button>
                  </div>
                )
              ) : (
                // Desktop version - Only file upload
                <div 
                  ref={dropAreaRef}
                  className={`w-full max-w-lg mx-auto flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors ${
                    isDragging 
                      ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5' 
                      : 'border-[rgb(var(--border))]/50 hover:border-[rgb(var(--primary))]/30'
                  }`}
                  onClick={triggerFileInput}
                >
                  <div className="mb-6">
                    <ArrowUpTrayIcon className="w-20 h-20 text-[rgb(var(--primary))]/40" />
                  </div>
                  <h3 className="text-xl font-medium text-center text-[rgb(var(--foreground))] mb-2">
                    Drag & Drop QR Code
                  </h3>
                  <p className="text-center text-[rgb(var(--muted-foreground))] mb-6">
                    or click to select a file from your computer
                  </p>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileInput();
                    }}
                    className="px-6 py-3 bg-[rgb(var(--primary))]/10 rounded-lg text-[rgb(var(--primary))] font-medium"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Select File
                  </motion.button>
                </div>
              )}

              {isProcessing && (
                <div className="mt-8 flex flex-col items-center">
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <ArrowPathIcon className="w-8 h-8 text-[rgb(var(--primary))]" />
                    </motion.div>
                  </div>
                  <p className="mt-4 text-[rgb(var(--foreground))]">Processing QR code...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QRScanner;
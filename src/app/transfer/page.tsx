'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { 
  ArrowRightIcon, 
  ArrowDownIcon,
  ArrowLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon,
  QrCodeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { useWallet } from '@/context/WalletContext'
import { 
  sendToAddress,
  sendToUsername,
  claimTransferByAddress,
  claimTransferByUsername,
  claimTransferById,
  refundTransfer,
  getPendingTransfers,
  getTransferDetails
} from '@/utils/contract'
import { useChainInfo } from '@/utils/useChainInfo';
import QRScanner from '@/components/qr/QRScanner';

enum TransferTabs {
  SEND = 'send',
  CLAIM = 'claim',
  REFUND = 'refund'
}

interface Transfer {
  id: string;
  sender: string;
  recipient: string;
  amount: string;
  timestamp: number;
  remarks: string;
  status: number;
}

// Animation variants
const pageTransition = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  }
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3 } 
  }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.3 } 
  }
}

export default function TransferPage() {
  const [activeTab, setActiveTab] = useState<TransferTabs>(TransferTabs.SEND)
  const [recipient, setRecipient] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [remarks, setRemarks] = useState<string>('')
  const [transferId, setTransferId] = useState('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingTransfers, setPendingTransfers] = useState<Transfer[]>([])
  const [pendingSentTransfers, setPendingSentTransfers] = useState<Transfer[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showTransactions, setShowTransactions] = useState(true)
  const [formStep, setFormStep] = useState<number>(1)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)
  const [showQrScanner, setShowQrScanner] = useState<boolean>(false)
  const [scannerMessage, setScannerMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const { signer, address } = useWallet()
  const { currentChain } = useChainInfo();
  const formRef = useRef<HTMLDivElement>(null)

  // Scroll to form when tab changes
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setFormStep(1); // Reset form step when tab changes
  }, [activeTab]);

  const fetchPendingTransfers = useCallback(async () => {
    if (!signer || !address) return

    try {
      setIsLoading(true)
      // Get all pending transfer IDs for the connected wallet
      const transferIds = await getPendingTransfers(signer, address)
      
      if (!transferIds || transferIds.length === 0) {
        setPendingTransfers([])
        setPendingSentTransfers([])
        return
      }

      // For each transfer ID, get the full details and parse them
      const transfers = await Promise.all(
        transferIds.map(async (id: string) => {
          try {
            const details = await getTransferDetails(signer, id)
            
            // Format the details into our Transfer interface format
            return {
              id,
              sender: details.sender || '',
              recipient: details.recipient || '',
              amount: details.amount ? details.amount.toString() : '0',
              timestamp: details.timestamp ? 
                (typeof details.timestamp === 'number' ? details.timestamp : 
                 details.timestamp.toNumber ? details.timestamp.toNumber() : 
                 details.timestamp.getTime ? details.timestamp.getTime() : 0) : 0,
              remarks: details.remarks || '',
              status: details.status !== undefined ? 
                (typeof details.status === 'number' ? details.status : 
                 details.status.toNumber ? details.status.toNumber() : 0) : 0
            } as Transfer
          } catch (err) {
            console.error(`Error fetching details for transfer ${id}:`, err)
            return null
          }
        })
      )
      
      // Filter out any failed transfers and split into received vs sent transfers
      const validTransfers = transfers.filter(t => t !== null) as Transfer[]
      
      // Transfers where the current address is the recipient
      const receivedTransfers = validTransfers.filter(t => 
        t.recipient.toLowerCase() === address.toLowerCase() && 
        t.status === 0 // Pending status
      )
      
      // Transfers where the current address is the sender
      const sentTransfers = validTransfers.filter(t => 
        t.sender.toLowerCase() === address.toLowerCase() && 
        t.status === 0 // Pending status
      )
      
      setPendingTransfers(receivedTransfers)
      setPendingSentTransfers(sentTransfers)
      
    } catch (err) {
      console.error('Error fetching transfers:', err)
    } finally {
      setIsLoading(false)
    }
  }, [signer, address])

  useEffect(() => {
    if (signer && address) {
      fetchPendingTransfers()
    }
  }, [fetchPendingTransfers, signer, address])

  const handleTabChange = (tab: TransferTabs) => {
    setActiveTab(tab)
    resetForm()
    setShowConfirmation(false)
  }

  const resetForm = () => {
    setRecipient('')
    setAmount('')
    setRemarks('')
    setTransferId('')
    setError('')
    setSuccess('')
    setFormStep(1)
  }

  const validateSendForm = (): string | null => {
    if (!recipient) return 'Recipient is required'
    if (!amount || parseFloat(amount) <= 0) return 'Valid amount is required'
    if (!remarks) return 'Please add a remark for the transfer'
    if (parseFloat(amount) > 1000000) return 'Amount exceeds maximum limit'
    return null
  }

  const handleConfirmSend = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signer || !address) {
      setError('Please connect your wallet first')
      return
    }

    const validationError = validateSendForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setShowConfirmation(true)
  }

  const handleSend = async () => {
    if (!signer || !address) {
      setError('Please connect your wallet first')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (recipient.startsWith('0x')) {
        await sendToAddress(signer, recipient, amount, remarks)
      } else {
        await sendToUsername(signer, recipient, amount, remarks)
      }
      
      setSuccess('Transfer initiated successfully!')
      setShowConfirmation(false)
      resetForm()
      // Let's wait a bit before fetching to ensure transaction is indexed
      setTimeout(() => fetchPendingTransfers(), 2000)
    } catch (error) {
      console.error('Transfer error:', error)
      setError(error instanceof Error ? error.message : 'Failed to initiate transfer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaim = async (id: string) => {
    if (!signer) {
      setError('Please connect your wallet first')
      return
    }
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (id.startsWith('0x') && id.length === 66) {
        await claimTransferById(signer, id)
      } else if (id.startsWith('0x')) {
        await claimTransferByAddress(signer, id)
      } else {
        await claimTransferByUsername(signer, id)
      }
      setSuccess('Transfer claimed successfully!')
      resetForm()
      setTimeout(() => fetchPendingTransfers(), 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to claim transfer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefund = async (id: string) => {
    if (!signer) {
      setError('Please connect your wallet first')
      return
    }
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      await refundTransfer(signer, id)
      setSuccess('Transfer refunded successfully!')
      resetForm()
      setTimeout(() => fetchPendingTransfers(), 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refund transfer')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedId(text)
        setTimeout(() => setCopiedId(null), 2000)
      })
      .catch(err => {
        console.error('Failed to copy text: ', err)
      })
  }

  // Helper to truncate long addresses/ids
  const truncateText = (text: string, startChars = 6, endChars = 4) => {
    if (!text) return '';
    if (text.length <= startChars + endChars) return text;
    return `${text.substring(0, startChars)}...${text.substring(text.length - endChars)}`;
  }

  const formatAmount = (amount: string) => {
    if (!amount) return '0';
    // Try to parse the amount and format it to a maximum of 6 decimal places
    try {
      const parsed = parseFloat(amount);
      if (isNaN(parsed)) return amount;
      
      // If it's a whole number, show no decimals
      if (parsed % 1 === 0) return parsed.toString();
      
      // Otherwise show up to 6 decimal places
      return parsed.toFixed(6).replace(/\.?0+$/, '');
    } catch (e) {
      return amount;
    }
  }

  const getTabLabel = () => {
    switch (activeTab) {
      case TransferTabs.SEND: return 'Send Funds Securely';
      case TransferTabs.CLAIM: return 'Claim Your Funds';
      case TransferTabs.REFUND: return 'Refund Your Transaction';
    }
  }

  const getTabDescription = () => {
    switch (activeTab) {
      case TransferTabs.SEND: return 'Send funds with protection - recipient must claim to receive';
      case TransferTabs.CLAIM: return 'Retrieve funds that have been sent to you';
      case TransferTabs.REFUND: return 'Retrieve unclaimed funds you\'ve sent';
    }
  }

  const renderSendForm = () => {
    const isNextButtonDisabled = () => {
      if (formStep === 1) {
        return !recipient || recipient.trim() === ''
      } else if (formStep === 2) {
        return !amount || parseFloat(amount) <= 0
      }
      return false
    }

    return (
      <AnimatePresence mode="wait">
        {showConfirmation ? (
          <motion.div 
            key="confirmation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="bg-[rgb(var(--primary))]/5 p-4 rounded-xl border border-[rgb(var(--primary))]/20">
              <h3 className="text-lg font-medium text-[rgb(var(--primary))] mb-4 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2" />
                Confirm Your Transfer
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-[rgb(var(--card))]/70 p-3 rounded-lg">
                  <span className="text-[rgb(var(--muted-foreground))]">Recipient</span>
                  <span className="text-[rgb(var(--foreground))] font-medium">{recipient.startsWith('0x') ? truncateText(recipient) : recipient}</span>
                </div>

                <div className="flex justify-between items-center bg-[rgb(var(--card))]/70 p-3 rounded-lg">
                  <span className="text-[rgb(var(--muted-foreground))]">Amount</span>
                  <span className="text-[rgb(var(--foreground))] font-medium">{amount} {currentChain.symbol}</span>
                </div>

                <div className="bg-[rgb(var(--card))]/70 p-3 rounded-lg">
                  <div className="text-[rgb(var(--muted-foreground))] mb-1">Message</div>
                  <div className="text-[rgb(var(--foreground))]">{remarks}</div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
                <p className="text-yellow-400 text-sm flex items-start">
                  <InformationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  Funds will be held securely until the recipient claims them. You can refund anytime if unclaimed.
                </p>
              </div>

              <div className="flex space-x-4">
                <motion.button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--muted-foreground))] px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-[rgb(var(--card))]/70"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back</span>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleSend}
                  className="flex-1 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-[rgb(var(--primary))]/90 disabled:opacity-70"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Confirm Transfer</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="send-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleConfirmSend}
            className="space-y-6"
          >
            <LayoutGroup>
              <AnimatePresence mode="wait">
                {formStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[rgb(var(--foreground))] font-medium flex items-center">
                          <UserCircleIcon className="w-5 h-5 mr-2" />
                          Recipient
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--foreground))] placeholder-[rgb(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/40"
                            placeholder="0x... or username"
                            required
                          />
                          {recipient && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs px-2 py-1 rounded bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
                              {recipient.startsWith('0x') ? 'Address' : 'Username'}
                            </div>
                          )}
                        </div>
                        
                        <motion.button
                          type="button"
                          onClick={() => document.getElementById('qr-scanner-trigger')?.click()}
                          className="p-3 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/10 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <QrCodeIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                      
                      <p className="mt-2 text-xs text-[rgb(var(--muted-foreground))] flex items-center">
                        <InformationCircleIcon className="w-4 h-4 mr-1" />
                        Enter wallet address or registered username
                      </p>
                    </div>
                    
                    {/* Hidden trigger for QR scanner */}
                    <button 
                      id="qr-scanner-trigger" 
                      className="hidden" 
                      onClick={() => document.querySelector('.fixed.bottom-8.right-8')?.dispatchEvent(
                        new MouseEvent('click', { bubbles: true })
                      )}
                    />
                    
                    <motion.button
                      type="button"
                      onClick={() => recipient ? setFormStep(2) : null}
                      disabled={!recipient}
                      className="w-full bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-[rgb(var(--primary))]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={recipient ? { scale: 1.02 } : undefined}
                      whileTap={recipient ? { scale: 0.98 } : undefined}
                    >
                      <span>Continue</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                )}

                {formStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="mb-2 text-green-400 font-medium flex items-center">
                        <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                        Amount ({currentChain.symbol})
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                        placeholder="0.0"
                        required
                        min="0"
                        step="0.000000000000000001"
                      />
                      {amount && parseFloat(amount) > 0 && (
                        <p className="mt-2 text-xs text-green-400 flex justify-end">
                          ≈ {formatAmount(amount)} {currentChain.symbol}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-4">
                      <motion.button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className="flex-1 bg-black/50 border border-gray-700 text-gray-300 px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-black/70"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Back</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={() => amount && parseFloat(amount) > 0 ? setFormStep(3) : null}
                        disabled={!amount || parseFloat(amount) <= 0}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-black px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={amount && parseFloat(amount) > 0 ? { scale: 1.02 } : undefined}
                        whileTap={amount && parseFloat(amount) > 0 ? { scale: 0.98 } : undefined}
                      >
                        <ArrowRightIcon className="w-5 h-5" />
                        <span>Continue</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {formStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="mb-2 text-green-400 font-medium flex items-center">
                        <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2" />
                        Message
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                        placeholder="Add a note about this transfer"
                        required
                        rows={3}
                      />
                      <p className="mt-2 text-xs text-gray-400 flex items-center">
                        <InformationCircleIcon className="w-4 h-4 mr-1" />
                        Add a message to help the recipient identify this transfer
                      </p>
                    </div>

                    <div className="flex space-x-4">
                      <motion.button
                        type="button"
                        onClick={() => setFormStep(2)}
                        className="flex-1 bg-black/50 border border-gray-700 text-gray-300 px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-black/70"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Back</span>
                      </motion.button>

                      <motion.button
                        type="submit"
                        disabled={!remarks}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-black px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={remarks ? { scale: 1.02 } : undefined}
                        whileTap={remarks ? { scale: 0.98 } : undefined}
                      >
                        <ArrowRightIcon className="w-5 h-5" />
                        <span>Review Transfer</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </LayoutGroup>
          </motion.form>
        )}
      </AnimatePresence>
    );
  };

  const renderClaimForm = () => {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleClaim(transferId);
      }} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-green-400 font-medium flex items-center">
              <UserCircleIcon className="w-5 h-5 mr-2" />
              Sender Identifier
            </label>
          </div>
          
          <input
            type="text"
            value={transferId}
            onChange={(e) => setTransferId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            placeholder="Address, username, or transfer ID"
            required
          />
          <p className="mt-2 text-xs text-gray-400 flex items-center">
            <InformationCircleIcon className="w-4 h-4 mr-1" />
            Enter sender's address/username or the full transfer ID
          </p>
        </div>

        <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20">
          <p className="text-gray-300 text-sm flex items-start">
            <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 text-green-400" />
            When you claim, funds will be immediately transferred to your wallet
          </p>
        </div>

        <motion.button
          type="submit"
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:brightness-110 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading || !signer || !transferId}
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <ArrowDownIcon className="w-5 h-5" />
              <span>Claim Funds</span>
            </>
          )}
        </motion.button>

        <div className="text-center text-sm text-gray-400">
          You can also claim directly from the list of pending transfers
        </div>
      </form>
    );
  };

  const renderRefundForm = () => {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleRefund(transferId);
      }} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-green-400 font-medium flex items-center">
              <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
              Transfer ID
            </label>
          </div>
          
          <input
            type="text"
            value={transferId}
            onChange={(e) => setTransferId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            placeholder="0x... (transfer ID)"
            required
          />
          <p className="mt-2 text-xs text-gray-400 flex items-center">
            <InformationCircleIcon className="w-4 h-4 mr-1" />
            Enter the transfer ID of the transaction you want to refund
          </p>
        </div>

        <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/20">
          <p className="text-gray-300 text-sm flex items-start">
            <InformationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 text-yellow-400" />
            Refunds are only possible for transfers that have not yet been claimed by the recipient
          </p>
        </div>

        <motion.button
          type="submit"
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:brightness-110 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading || !signer || !transferId}
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Refund Transfer</span>
            </>
          )}
        </motion.button>

        <div className="text-center text-sm text-gray-400">
          You can also refund directly from your list of pending transfers
        </div>
      </form>
    );
  };

  const renderForm = () => {
    switch (activeTab) {
      case TransferTabs.SEND:
        return renderSendForm();
      case TransferTabs.CLAIM:
        return renderClaimForm();
      case TransferTabs.REFUND:
        return renderRefundForm();
      default:
        return null;
    }
  };

  const renderTransferList = () => {
    // Select which transfers to display based on the active tab
    const transfers = activeTab === TransferTabs.CLAIM ? pendingTransfers :
                      activeTab === TransferTabs.REFUND ? pendingSentTransfers :
                      [...pendingTransfers, ...pendingSentTransfers];

    if (!signer) {
      return (
        <div className="text-center py-8 text-gray-400">
          Connect wallet to view transfers
        </div>
      );
    }

    if (isLoading && !transfers.length) {
      return (
        <div className="text-center py-8 flex flex-col items-center justify-center">
          <ArrowPathIcon className="w-8 h-8 text-green-400 animate-spin mb-4" />
          <p className="text-gray-400">Loading transfers...</p>
        </div>
      );
    }

    if (transfers.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400 flex flex-col items-center">
          <div className="bg-black/30 p-4 rounded-full mb-4">
            {activeTab === TransferTabs.CLAIM ? (
              <ArrowDownIcon className="w-10 h-10 text-green-400 opacity-50" />
            ) : activeTab === TransferTabs.REFUND ? (
              <ArrowLeftIcon className="w-10 h-10 text-green-400 opacity-50" />
            ) : (
              <ArrowRightIcon className="w-10 h-10 text-green-400 opacity-50" />
            )}
          </div>
          <p>No pending transfers found</p>
          {activeTab === TransferTabs.SEND && (
            <button 
              onClick={() => setFormStep(1)}
              className="mt-4 text-green-400 hover:text-green-300 text-sm underline flex items-center"
            >
              <ArrowRightIcon className="w-4 h-4 mr-1" />
              Send your first transfer
            </button>
          )}
        </div>
      );
    }

    return (
      <motion.div 
        className="space-y-4 max-h-[400px] overflow-y-auto pr-2 styled-scrollbar"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {transfers.map((transfer) => (
          <motion.div
            key={transfer.id}
            className="relative group"
            variants={slideIn}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-black/30 backdrop-blur-xl p-4 rounded-xl border border-green-500/10 group-hover:border-green-500/20">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    {activeTab === TransferTabs.CLAIM || 
                     (activeTab === TransferTabs.SEND && transfer.sender.toLowerCase() !== address?.toLowerCase()) ? 
                      `From: ${truncateText(transfer.sender)}` : 
                      `To: ${truncateText(transfer.recipient)}`}
                  </div>
                  <div className="text-green-400 font-semibold">{formatAmount(transfer.amount)} {currentChain.symbol}</div>
                </div>
                <motion.button
                  onClick={() => {
                    if (activeTab === TransferTabs.CLAIM || 
                        (activeTab === TransferTabs.SEND && transfer.recipient.toLowerCase() === address?.toLowerCase())) {
                      handleClaim(transfer.id);
                    } else {
                      handleRefund(transfer.id);
                    }
                  }}
                  className={`${
                    (activeTab === TransferTabs.CLAIM || 
                     (activeTab === TransferTabs.SEND && transfer.recipient.toLowerCase() === address?.toLowerCase()))
                      ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                      : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                  } border px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                >
                  {(activeTab === TransferTabs.CLAIM || 
                    (activeTab === TransferTabs.SEND && transfer.recipient.toLowerCase() === address?.toLowerCase())) ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Claim</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-4 h-4" />
                      <span>Refund</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Transfer ID with copy button */}
              <div className="flex items-center space-x-2 mb-2 bg-black/40 p-2 rounded-lg">
                <div className="text-xs text-gray-400 overflow-hidden text-ellipsis">
                  ID: {truncateText(transfer.id, 8, 8)}
                </div>
                <motion.button
                  onClick={() => copyToClipboard(transfer.id)}
                  className="bg-black/30 p-1 rounded text-green-400 hover:text-green-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Copy Transfer ID"
                >
                  {copiedId === transfer.id ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  )}
                </motion.button>
                <motion.button
                  onClick={() => {
                    setTransferId(transfer.id);
                    if (transfer.sender.toLowerCase() === address?.toLowerCase()) {
                      setActiveTab(TransferTabs.REFUND);
                    } else {
                      setActiveTab(TransferTabs.CLAIM);
                    }
                  }}
                  className="text-xs bg-green-500/10 px-2 py-0.5 rounded text-green-400 hover:bg-green-500/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Use
                </motion.button>
              </div>

              {transfer.remarks && (
                <div className="bg-black/20 p-2 rounded-lg text-sm text-gray-400 mb-2">
                  {transfer.remarks}
                </div>
              )}
              <div className="text-xs text-gray-500 flex items-center space-x-2">
                <ClockIcon className="w-4 h-4" />
                <span>{new Date(transfer.timestamp * 1000).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  // Handle QR scan
  const handleQRScan = (data: string) => {
    console.log("QR Scanned:", data);
    // Check if it's a valid address (starts with 0x)
    if (data && data.startsWith('0x')) {
      setRecipient(data);
      setActiveTab(TransferTabs.SEND);
      setFormStep(1);
      setSuccess('Address scanned successfully');
      setTimeout(() => setSuccess(''), 3000);
    } else if (data) {
      // If it's not an address but some other data (possibly a transfer ID)
      setTransferId(data);
      setActiveTab(TransferTabs.CLAIM);
      setSuccess('QR code scanned successfully');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Invalid QR code format');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Handle QR scan error
  const handleQRError = (error: string) => {
    console.error("QR Scan Error:", error);
    setError(`QR Scan error: ${error}`);
    setTimeout(() => setError(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-black to-green-950 overflow-x-hidden">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-30" />
      
      <motion.div 
        className="container mx-auto px-4 py-16 md:py-20 relative z-10"
        initial="initial"
        animate="animate"
        variants={pageTransition}
      >
        {/* Header */}
        <motion.div className="text-center mb-12">
          <motion.div
            className="inline-block mb-6"
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(16, 185, 129, 0.2)",
                "0 0 60px rgba(16, 185, 129, 0.4)",
                "0 0 20px rgba(16, 185, 129, 0.2)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="bg-black/30 p-6 rounded-2xl backdrop-blur-xl border border-green-500/10">
              {activeTab === TransferTabs.SEND && <ArrowRightIcon className="w-16 h-16 text-green-400" />}
              {activeTab === TransferTabs.CLAIM && <ArrowDownIcon className="w-16 h-16 text-green-400" />}
              {activeTab === TransferTabs.REFUND && <ArrowLeftIcon className="w-16 h-16 text-green-400" />}
            </div>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
              {getTabLabel()}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            {getTabDescription()}
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto mb-8 px-2">
          <div className="flex rounded-xl overflow-hidden bg-black/30 backdrop-blur-xl border border-green-500/20 p-1">
            {Object.values(TransferTabs).map((tab) => (
              <motion.button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-green-500 text-black shadow-lg' 
                    : 'text-green-400 hover:bg-green-500/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div ref={formRef} className="max-w-4xl mx-auto">
          <div className="md:grid md:grid-cols-12 gap-8">
            {/* Left Panel - Form */}
            <motion.div 
              className="md:col-span-7 mb-8 md:mb-0"
              variants={pageTransition}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl" />
                <div className="relative bg-black/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-green-500/20">
                  <h2 className="text-xl font-semibold text-green-400 mb-6 flex items-center">
                    {activeTab === TransferTabs.SEND && (
                      <>
                        <ArrowRightIcon className="w-5 h-5 mr-2" />
                        <span>Send Secure Transfer</span>
                      </>
                    )}
                    {activeTab === TransferTabs.CLAIM && (
                      <>
                        <ArrowDownIcon className="w-5 h-5 mr-2" />
                        <span>Claim Your Funds</span>
                      </>
                    )}
                    {activeTab === TransferTabs.REFUND && (
                      <>
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        <span>Refund Your Transfer</span>
                      </>
                    )}
                  </h2>
                  
                  {renderForm()}
                </div>
              </div>
            </motion.div>

            {/* Right Panel - List */}
            <motion.div 
              className="md:col-span-5"
              variants={pageTransition}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl" />
                <div className="relative bg-black/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-green-500/20">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-green-400 flex items-center">
                      <ClockIcon className="w-5 h-5 mr-2" />
                      <span>
                        {activeTab === TransferTabs.SEND ? 'Recent Transfers' :
                         activeTab === TransferTabs.CLAIM ? 'Pending Claims' :
                         'Pending Refunds'}
                      </span>
                    </h2>
                    
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={fetchPendingTransfers}
                        className="bg-black/30 p-2 rounded-lg text-green-400 hover:text-green-300"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Refresh"
                      >
                        <ArrowPathIcon className="w-5 h-5" />
                      </motion.button>
                      
                      <motion.button
                        onClick={() => setShowTransactions(!showTransactions)}
                        className="bg-black/30 p-2 rounded-lg text-green-400 hover:text-green-300 md:hidden"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={showTransactions ? "Hide Transactions" : "Show Transactions"}
                      >
                        {showTransactions ? (
                          <ChevronUpIcon className="w-5 h-5" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {(showTransactions || window.innerWidth >= 768) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {renderTransferList()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Feature Callouts - Desktop: horizontal, Mobile: vertical */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8">
            <motion.div 
              className="bg-black/30 backdrop-blur-sm border border-green-500/10 rounded-xl p-4 hover:border-green-500/20"
              variants={fadeIn}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-500/10 p-2 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-green-400">Secure Transfers</h3>
                  <p className="text-sm text-gray-400">Funds are held in escrow until claimed</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-black/30 backdrop-blur-sm border border-green-500/10 rounded-xl p-4 hover:border-green-500/20"
              variants={fadeIn}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-500/10 p-2 rounded-lg">
                  <UserCircleIcon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-green-400">Username Support</h3>
                  <p className="text-sm text-gray-400">Send to usernames instead of addresses</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-black/30 backdrop-blur-sm border border-green-500/10 rounded-xl p-4 hover:border-green-500/20"
              variants={fadeIn}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-500/10 p-2 rounded-lg">
                  <QrCodeIcon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-green-400">QR Scan & Share</h3>
                  <p className="text-sm text-gray-400">Easily send and receive with QR codes</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Success/Error Messages */}
          <AnimatePresence>
            {(success || error) && (
              <motion.div
                className="fixed bottom-8 right-8 max-w-md z-50"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className={`p-4 rounded-xl backdrop-blur-xl border ${
                    success
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {success ? (
                      <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <p>{success || error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* QR Scanner */}
      <QRScanner 
        onScan={handleQRScan}
        onError={handleQRError}
      />

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .styled-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .styled-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .styled-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 3px;
        }
        .styled-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}
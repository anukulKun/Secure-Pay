'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChatBubbleBottomCenterTextIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useWallet } from '@/context/WalletContext'
import { 
  sendToAddress,
  sendToUsername,
  claimTransferByAddress,
  claimTransferByUsername,
  claimTransferById,
  refundTransfer,
  getPendingTransfers,
  getTransferDetails,
  getUserTransfers
} from '@/utils/contract'
import { useChainInfo } from '@/utils/useChainInfo';
import QRScanner from '@/components/qr/QRScanner'
import { shortenAddress, isValidAddress } from '@/utils/address'
import { useChain } from '@/hooks/useChain'
import { ethers } from 'ethers'

// Transfer interface matching the one in transfer/page.tsx
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

export default function TransferPage() {
  const [recipient, setRecipient] = useState('')
  const { nativeToken } = useChain();
  const [amount, setAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [claimInput, setClaimInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isClaimLoading, setIsClaimLoading] = useState(false)
  const [error, setError] = useState('')
  const [claimError, setClaimError] = useState('')
  const [success, setSuccess] = useState('')
  const [claimSuccess, setClaimSuccess] = useState('')
  const [recentActivity, setRecentActivity] = useState<Transfer[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const { address: wagmiAddress } = useAccount()
  const { signer } = useWallet()
  const { currentChain } = useChainInfo()
  
  // Scroll to form when tab changes
  const formRef = useRef<HTMLDivElement>(null)

  const isUserConnected = !!wagmiAddress

  const fetchRecentActivity = useCallback(async () => {
    if (!signer || !wagmiAddress) return

    try {
      setIsLoading(true)
      console.log('Fetching pending transfers for address:', wagmiAddress)

      // Direct implementation from transfer/page.tsx
      // Get all pending transfer IDs for the connected wallet
      const transferIds = await getPendingTransfers(signer, wagmiAddress)
      console.log('Transfer IDs:', transferIds)
      
      if (!transferIds || transferIds.length === 0) {
        console.log('No pending transfers found')
        setRecentActivity([])
        setIsLoading(false)
        return
      }

      // For each transfer ID, get the full details and parse them
      const transfers = await Promise.all(
        transferIds.map(async (id: string) => {
          try {
            const details = await getTransferDetails(signer, id)
            console.log('Transfer details for ID', id, ':', details)
            
            // Format the details into our Transfer interface format
            return {
              id,
              sender: details.sender,
              recipient: details.recipient,
              amount: details.amount, // Already formatted in getTransferDetails
              timestamp: details.timestamp, // Already converted in getTransferDetails
              remarks: details.remarks,
              status: details.status
            }
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
        t.recipient.toLowerCase() === wagmiAddress.toLowerCase() && 
        t.status === 0 // Pending status
      )
      
      // Transfers where the current address is the sender
      const sentTransfers = validTransfers.filter(t => 
        t.sender.toLowerCase() === wagmiAddress.toLowerCase() && 
        t.status === 0 // Pending status
      )
      
      // Sort by timestamp (newest first)
      const allPendingTransfers = [...receivedTransfers, ...sentTransfers]
      allPendingTransfers.sort((a, b) => b.timestamp - a.timestamp)
      
      console.log('Resolved pending transfers:', allPendingTransfers)
      setRecentActivity(allPendingTransfers)
    } catch (err) {
      console.error('Error fetching transfers:', err)
      setRecentActivity([])
    } finally {
      setIsLoading(false)
    }
  }, [signer, wagmiAddress])

  // Directly using the effect pattern from transfer/page.tsx
  useEffect(() => {
    if (signer && wagmiAddress) {
      fetchRecentActivity()
      
      // Simple refresh interval
      const interval = setInterval(() => {
        console.log('Refreshing transfers...')
        fetchRecentActivity()
      }, 15000) // every 15 seconds
      
      return () => clearInterval(interval)
    }
  }, [signer, wagmiAddress, fetchRecentActivity])

  const resetForm = () => {
    setRecipient('')
    setAmount('')
    setRemarks('')
    setClaimInput('')
    setError('')
    setSuccess('')
  }

  const handleSendTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signer) {
      setError('Please connect your wallet first')
      return
    }
    
    if (!recipient) {
      setError('Please enter a recipient')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // Direct implementation from transfer/page.tsx
      if (isValidAddress(recipient)) {
        await sendToAddress(signer, recipient, amount, remarks || '')
      } else {
        await sendToUsername(signer, recipient, amount, remarks || '')
      }
      
      setSuccess('Transfer sent successfully! The recipient must claim the transfer to complete it.')
      resetForm()
      setTimeout(() => fetchRecentActivity(), 2000)
    } catch (err: any) {
      console.error('Error sending transfer:', err)
      
      // Provide specific error messages for common issues
      if (err.message?.includes('insufficient funds') || err.message?.includes('insufficient balance')) {
        setError('Insufficient balance. Please check your wallet balance and try again.')
      } else if (err.message?.includes('user not found') || err.message?.includes('not registered')) {
        setError(`Username "${recipient}" does not exist. Please verify the username and try again.`)
      } else if (err.message?.includes('gas')) {
        setError('Gas estimation failed. You may have insufficient funds for gas fees.')
      } else if (err.message?.includes('rejected')) {
        setError('Transaction was rejected. Please try again.')
      } else {
        setError(`Failed to send transfer: ${err.message || 'Unknown error'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimTransfer = async (id: string) => {
    if (!signer) {
      setError('Please connect your wallet first')
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // Direct implementation from transfer/page.tsx
      await claimTransferById(signer, id)
      setSuccess('Transfer claimed successfully!')
      setTimeout(() => fetchRecentActivity(), 2000)
    } catch (err: any) {
      console.error('Error claiming transfer:', err)
      
      // Simply show the error message from the contract
      if (err.data?.message) {
        setError(err.data.message)
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Failed to claim transfer. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimTransferByUsername = async () => {
    if (!signer || !claimInput) {
      setClaimError('Please connect your wallet and enter a sender or transfer ID')
      return
    }
    
    setIsClaimLoading(true)
    setClaimError('')
    setClaimSuccess('')
    
    try {
      // Detect input type based on format
      if (isValidAddress(claimInput)) {
        // Input is a wallet address
        await claimTransferByAddress(signer, claimInput)
      } else if (claimInput.length >= 64 || claimInput.startsWith('0x')) {
        // Input appears to be a transfer ID (long hash)
        await claimTransferById(signer, claimInput)
      } else {
        // Input is likely a username
        await claimTransferByUsername(signer, claimInput)
      }
      
      // Transaction is already completed in the utility functions
      setClaimSuccess('Transfer claimed successfully!')
      // Reset form field
      setClaimInput('')
      
      // Refresh the transfer list after a short delay
      setTimeout(() => fetchRecentActivity(), 2000)
    } catch (err: any) {
      console.error('Error claiming transfer:', err)
      
      // Provide specific error messages
      if (err.message?.includes('not found') || err.message?.includes('invalid transfer')) {
        setClaimError('Transfer not found. Please verify your information and try again.')
      } else if (err.message?.includes('not recipient')) {
        setClaimError('You are not the recipient of this transfer.')
      } else if (err.message?.includes('already claimed')) {
        setClaimError('This transfer has already been claimed.')
      } else if (err.message?.includes('user not found') || err.message?.includes('not registered')) {
        setClaimError('The username does not exist. Please verify and try again.')
      } else {
        setClaimError(`Failed to claim transfer: ${err.message || 'Unknown error'}`)
      }
    } finally {
      setIsClaimLoading(false)
    }
  }

  // Exact implementation from transfer/page.tsx
  const handleRefundTransfer = async (id: string) => {
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
      setTimeout(() => fetchRecentActivity(), 2000)
    } catch (error) {
      console.error('Refund error:', error)
      setError(error instanceof Error ? error.message : 'Failed to refund transfer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleQrCodeScan = (data: string) => {
    setShowQrScanner(false)
    if (data) {
      // If QR data looks like an address, set it as recipient for sending
      // Otherwise, set it as claim input
      if (isValidAddress(data) && data.length === 42) {
        setRecipient(data)
      } else {
        setClaimInput(data)
      }
    }
  }

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <motion.div 
        className="mb-8"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-2">Transfer</h1>
        <p className="text-[rgb(var(--muted-foreground))]">
          Send, claim, and manage secure crypto transfers across chains
        </p>
      </motion.div>

      {!isUserConnected ? (
        <motion.div 
          className="card backdrop-blur-lg p-8 text-center"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <UserCircleIcon className="w-16 h-16 text-[rgb(var(--primary))] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            Please connect your wallet to send or manage transfers.
          </p>
          <ConnectButton />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Transfer Form */}
          <motion.div 
            className="lg:col-span-3"
            variants={fadeIn}
            initial="initial"
            animate="animate"
          >
            <div className="card backdrop-blur-lg border border-[rgb(var(--border))]/50 p-6" ref={formRef}>
              <h2 className="text-xl font-semibold mb-4 text-[rgb(var(--foreground))]">Send a Transfer</h2>
              
              {/* Send Transfer Form */}
              <form onSubmit={handleSendTransfer} className="space-y-4">
                <div>
                  <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Recipient Address or Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full bg-[rgb(var(--muted))]/20 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50"
                      placeholder="0x... or username"
                    />
                    <button
                      type="button"
                      onClick={() => setShowQrScanner(true)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--primary))]"
                    >
                      <QrCodeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-[rgb(var(--muted))]/20 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50"
                      placeholder="0.0"
                      step="0.00001"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--muted-foreground))]">
                      <CurrencyDollarIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Remarks (Optional)</label>
                  <div className="relative">
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full bg-[rgb(var(--muted))]/20 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50"
                      placeholder="Add a short message or description"
                      rows={2}
                    />
                    <div className="absolute right-3 top-3 text-[rgb(var(--muted-foreground))]">
                      <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-700 dark:text-red-300 p-4 rounded-xl">
                    <p>{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 border border-green-500/50 text-green-700 dark:text-green-300 p-4 rounded-xl">
                    <p>{success}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/90 text-[rgb(var(--primary-foreground))] py-3 px-4 rounded-xl font-medium flex justify-center items-center"
                >
                  {isLoading ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheckIcon className="w-5 h-5 mr-2" />
                      <span>Send Secure Transfer</span>
                    </>
                  )}
                </button>
              </form>
              
              {/* Feature Highlights */}
              <div className="mt-6 pt-6 border-t border-[rgb(var(--border))]/50">
                <h3 className="text-lg font-medium mb-3 text-[rgb(var(--foreground))]">Why use Secure Transfers?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: ShieldCheckIcon, text: "Funds are held securely until claimed" },
                    { icon: ArrowRightIcon, text: "Send across multiple blockchains" },
                    { icon: CheckCircleIcon, text: "Easy to send using just a username" },
                    { icon: InformationCircleIcon, text: "Refundable if the recipient doesn't claim" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start space-x-3 text-sm">
                      <div className="bg-[rgb(var(--primary))]/10 p-2 rounded-lg">
                        <item.icon className="w-4 h-4 text-[rgb(var(--primary))]" />
                      </div>
                      <span className="text-[rgb(var(--muted-foreground))]">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Right Column - Recent Activity */}
          <motion.div 
            className="lg:col-span-2"
            variants={fadeIn}
            initial="initial"
            animate="animate"
          >
            <div className="card backdrop-blur-lg border border-[rgb(var(--border))]/50 p-6">
              <h2 className="text-xl font-semibold mb-4 text-[rgb(var(--foreground))]">Recent Activity</h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <ArrowPathIcon className="w-8 h-8 text-[rgb(var(--primary))] animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="card backdrop-blur-lg border border-[rgb(var(--border))]/50 p-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">
                        Pending Transfers
                      </h2>
                      <button
                        onClick={() => {
                          setIsLoading(true)
                          console.log('Manual refresh triggered')
                          fetchRecentActivity()
                        }}
                        className="flex items-center space-x-2 text-sm text-[rgb(var(--primary))] hover:text-[rgb(var(--primary))]/80 px-3 py-1 rounded-lg border border-[rgb(var(--primary))]/20 hover:bg-[rgb(var(--primary))]/10 transition-all"
                      >
                        <ArrowPathIcon className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
                      </button>
                    </div>

                    {isLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <ArrowPathIcon className="w-8 h-8 text-[rgb(var(--primary))] animate-spin" />
                      </div>
                    ) : recentActivity.length > 0 ? (
                      <div className="space-y-3">
                        {recentActivity.map((transfer) => {
                          // Direct implementation from transfer/page.tsx logic
                          const isRecipient = transfer.recipient.toLowerCase() === wagmiAddress?.toLowerCase()
                          const isSender = transfer.sender.toLowerCase() === wagmiAddress?.toLowerCase()
                          
                          return (
                            <div key={transfer.id} className="bg-white/5 p-4 rounded-lg border border-[rgb(var(--border))]/50">
                              <div className="flex justify-between mb-3">
                                <div>
                                  <div className="text-sm text-[rgb(var(--muted-foreground))] mb-1">
                                    {isRecipient ? 'From: ' : 'To: '}
                                    <span className="font-mono">
                                      {shortenAddress(isRecipient ? transfer.sender : transfer.recipient)}
                                    </span>
                                  </div>
                                  <div className="text-lg font-semibold">
                                    {transfer.amount} {nativeToken}
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  {isRecipient && (
                                    // Claim button for recipient
                                    <button
                                      onClick={() => handleClaimTransfer(transfer.id)}
                                      className="bg-[rgb(var(--primary))]/10 hover:bg-[rgb(var(--primary))]/20 text-[rgb(var(--primary))] px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                                    >
                                      Claim
                                    </button>
                                  )}
                                  {isSender && (
                                    // Refund button for sender
                                    <button
                                      onClick={() => handleRefundTransfer(transfer.id)}
                                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                                    >
                                      Refund
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-[rgb(var(--muted-foreground))]">
                                <div className="flex items-center">
                                  <ClockIcon className="w-3 h-3 mr-1" />
                                  {formatDate(transfer.timestamp)}
                                </div>
                                <button 
                                  onClick={() => handleCopyId(transfer.id)}
                                  className="text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--primary))]"
                                  title="Copy Transfer ID"
                                >
                                  {copiedId === transfer.id ? 
                                    <CheckCircleIcon className="w-4 h-4 text-green-500" /> : 
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                  }
                                </button>
                              </div>
                              
                              {transfer.remarks && (
                                <div className="mt-2 p-2 bg-black/20 rounded text-sm">
                                  {transfer.remarks}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-center">
                        <ShieldCheckIcon className="w-12 h-12 text-[rgb(var(--primary))]" />
                        <p className="text-[rgb(var(--foreground))] font-medium mt-4">No Pending Transfers</p>
                        <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
                          You don't have any pending transfers to claim or refund
                        </p>
                        <button
                          onClick={() => fetchRecentActivity()}
                          className="mt-4 flex items-center space-x-2 text-sm text-[rgb(var(--primary))] hover:text-[rgb(var(--primary))]/80"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                          <span>Refresh</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Claim Transfer Box */}
            <div className="my-6"></div>

            <div className="card backdrop-blur-lg border border-[rgb(var(--border))]/50 p-6">
              <h2 className="text-xl font-semibold mb-4 text-[rgb(var(--foreground))]">Claim Transfer</h2>
              <form onSubmit={handleClaimTransferByUsername} className="space-y-4">
                <div>
                  <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Transfer ID, Sender Address, or Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={claimInput}
                      onChange={(e) => setClaimInput(e.target.value)}
                      className="w-full bg-[rgb(var(--muted))]/20 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50"
                      placeholder="Enter transfer ID, sender address, or username"
                    />
                    <button
                      type="button"
                      onClick={() => setShowQrScanner(true)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--primary))]"
                    >
                      <QrCodeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {claimError && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-700 dark:text-red-300 p-4 rounded-xl">
                    <p>{claimError}</p>
                  </div>
                )}
                
                {claimSuccess && (
                  <div className="bg-green-500/10 border border-green-500/50 text-green-700 dark:text-green-300 p-4 rounded-xl">
                    <p>{claimSuccess}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isClaimLoading}
                  className="w-full bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/90 text-[rgb(var(--primary-foreground))] py-3 px-4 rounded-xl font-medium flex justify-center items-center"
                >
                  {isClaimLoading ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  ) : "Claim Transfer"}
                </button>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center text-xs text-[rgb(var(--muted-foreground))]">
                    <InformationCircleIcon className="w-4 h-4 mr-1" />
                    <span>We'll automatically detect if you've entered a transfer ID, address, or username</span>
                  </div>
                </div>
              </form>
            </div>

            {/* QR Scanner Modal */}
            {showQrScanner && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background))] backdrop-blur-sm">
                <div className="bg-[rgb(var(--background))] border border-[rgb(var(--border))]/20 rounded-2xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium mb-3 text-[rgb(var(--foreground))]">Scan QR Code</h3>
                    <button 
                      onClick={() => setShowQrScanner(false)}
                      className="text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--primary))]"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
                  <QRScanner onScan={handleQrCodeScan} />
                  <p className="text-sm text-[rgb(var(--muted-foreground))] mt-4 text-center">
                    Scan a wallet address or transfer ID
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
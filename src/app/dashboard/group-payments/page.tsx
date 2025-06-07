'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UsersIcon, 
  PlusIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  UserCircleIcon,
  CurrencyDollarIcon,
  WalletIcon,
  ClockIcon,
  UserGroupIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { 
  createGroupPayment, 
  contributeToGroupPayment, 
  getGroupPaymentDetails, 
  getUserProfile, 
  hasContributedToGroupPayment,
  handleContractError
} from '../../../utils/contract'
import { useChain } from '@/hooks/useChain'

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

interface GroupPayment {
  id: string;
  paymentId: string;
  creator: string;
  recipient: string;
  totalAmount: string;
  amountPerPerson: string;
  numParticipants: number;
  amountCollected: string;
  timestamp: number;
  status: number;
  remarks: string;
}

export default function GroupPaymentsPage() {
  const { address, isConnected } = useAccount()
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [isContributingToGroup, setIsContributingToGroup] = useState(false)
  const { nativeToken } = useChain();
  const [recipient, setRecipient] = useState('')
  const [participants, setParticipants] = useState('')
  const [amount, setAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [groupPayments, setGroupPayments] = useState<GroupPayment[]>([])
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userContributions, setUserContributions] = useState<Record<string, boolean>>({})
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);
  const [paymentIdToContribute, setPaymentIdToContribute] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [isLoadingAmount, setIsLoadingAmount] = useState(false);
  
  // Get signer instance
  useEffect(() => {
    const getSigner = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum as any)
          const signer = provider.getSigner()
          setSigner(signer)
        } catch (err) {
          console.error('Error getting signer:', err)
        }
      }
    }
    
    if (isConnected) {
      getSigner()
    }
  }, [isConnected])
  
  // Fetch group payments
  const fetchGroupPayments = useCallback(async () => {
    if (!signer || !address) return
    
    try {
      setIsRefreshing(true)
      const profile = await getUserProfile(signer, address)
      
      if (!profile || !profile.groupPaymentIds || profile.groupPaymentIds.length === 0) {
        setGroupPayments([])
        return
      }
      
      const payments = await Promise.all(
        profile.groupPaymentIds.map(async (id) => {
          try {
            const payment = await getGroupPaymentDetails(signer, id)
            
            // Check if user has contributed to this payment
            const hasContributed = await hasContributedToGroupPayment(signer, id, address)
            setUserContributions(prev => ({...prev, [id]: hasContributed}))
            
            return payment
          } catch (err) {
            console.error(`Error fetching payment ${id}:`, err)
            return null
          }
        })
      )
      
      // Also fetch participated payments
      const participatedPayments = await Promise.all(
        (profile.participatedGroupPayments || []).map(async (id) => {
          try {
            const payment = await getGroupPaymentDetails(signer, id)
            
            // User has definitely contributed to these
            setUserContributions(prev => ({...prev, [id]: true}))
            
            return payment
          } catch (err) {
            console.error(`Error fetching participated payment ${id}:`, err)
            return null
          }
        })
      )
      
      // Filter out nulls and combine arrays removing duplicates
      const allPayments = [...payments, ...participatedPayments]
        .filter((payment): payment is GroupPayment => payment !== null)
        .reduce((acc, current) => {
          const x = acc.find(item => item.paymentId === current.paymentId)
          if (!x) {
            return acc.concat([current])
          } else {
            return acc
          }
        }, [] as GroupPayment[])
      
      // Sort by timestamp, newest first
      allPayments.sort((a, b) => b.timestamp - a.timestamp)
      
      setGroupPayments(allPayments)
    } catch (err) {
      console.error('Error fetching group payments:', err)
      setError(handleContractError(err))
    } finally {
      setIsRefreshing(false)
    }
  }, [signer, address])
  
  // Fetch payments when signer/address changes
  useEffect(() => {
    if (signer && address) {
      fetchGroupPayments()
    }
  }, [signer, address, fetchGroupPayments])
  
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signer) {
      setError('Please connect your wallet to create a group payment')
      return
    }
    
    if (!recipient) {
      setError('Please enter a recipient address')
      return
    }
    
    if (!participants || isNaN(parseInt(participants)) || parseInt(participants) <= 0) {
      setError('Please enter a valid number of participants')
      return
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const tx = await createGroupPayment(
        signer,
        recipient,
        parseInt(participants),
        amount,
        remarks || 'Group Payment'
      )
      
      await tx
      setSuccess('Group payment created successfully!')
      fetchGroupPayments()
      
      // Reset form values
      setRecipient('')
      setParticipants('')
      setAmount('')
      setRemarks('')
      setIsCreatingGroup(false)
    } catch (err) {
      console.error('Error creating group payment:', err)
      setError(handleContractError(err))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleContribute = async (paymentId: string, amountPerPerson: string) => {
    if (!signer) {
      setError('Please connect your wallet to contribute')
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const tx = await contributeToGroupPayment(signer, paymentId, amountPerPerson)
      
      await tx
      setSuccess('Contribution successful!')
      fetchGroupPayments()
    } catch (err) {
      console.error('Error contributing to group payment:', err)
      setError(handleContractError(err))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedPaymentId(id);
      setTimeout(() => setCopiedPaymentId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy to clipboard');
    }
  };
  
  // Handle payment ID change to automatically fetch amount
  const handlePaymentIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    setPaymentIdToContribute(id);
    setContributionAmount('');
    
    // Only try to fetch if it looks like a valid payment ID
    if (id.length === 66 && id.startsWith('0x')) {
      try {
        setIsLoadingAmount(true);
        const payment = await getGroupPaymentDetails(signer!, id);
        if (payment) {
          setContributionAmount(payment.amountPerPerson);
        }
      } catch (err) {
        console.error('Error fetching payment details:', err);
        // Don't show error yet, let them finish typing
      } finally {
        setIsLoadingAmount(false);
      }
    }
  };
  
  const handleContributeToId = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signer) {
      setError('Please connect your wallet to contribute');
      return;
    }
    
    if (!paymentIdToContribute) {
      setError('Please enter a payment ID');
      return;
    }
    
    if (!contributionAmount) {
      setError('Please enter a contribution amount');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const tx = await contributeToGroupPayment(signer, paymentIdToContribute, contributionAmount);
      await tx;
      setSuccess('Contribution successful!');
      fetchGroupPayments();
      
      // Reset form and close popup
      setPaymentIdToContribute('');
      setContributionAmount('');
      setIsContributingToGroup(false);
    } catch (err) {
      console.error('Error contributing to group payment:', err);
      setError(handleContractError(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date to readable string
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    })
  }
  
  // Calculate progress percentage
  const calculateProgress = (collected: string, total: string) => {
    const collectedValue = parseFloat(collected)
    const totalValue = parseFloat(total)
    if (isNaN(collectedValue) || isNaN(totalValue) || totalValue === 0) return 0
    return Math.min(100, (collectedValue / totalValue) * 100)
  }
  
  // Shorten addresses for display
  const shortenAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div 
        className="mb-8"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-2">Group Payments</h1>
        <p className="text-[rgb(var(--muted-foreground))]">
          Create and manage split payments with friends and colleagues
        </p>
      </motion.div>

      {/* Error/Success Notifications */}
      {error && (
        <motion.div 
          className="bg-red-500/10 border border-red-500/50 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 flex items-start"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <ExclamationCircleIcon className="w-6 h-6 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div 
          className="bg-green-500/10 border border-green-500/50 text-green-700 dark:text-green-300 p-4 rounded-xl mb-6 flex items-start"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <CheckCircleIcon className="w-6 h-6 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Success</p>
            <p className="text-sm">{success}</p>
          </div>
        </motion.div>
      )}

      {!isConnected ? (
        <motion.div 
          className="card backdrop-blur-lg p-8 text-center"
          variants={fadeIn}
        >
          <UserCircleIcon className="w-16 h-16 text-[rgb(var(--primary))] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            Please connect your wallet to create or join group payments.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Action Buttons Row */}
          {!isCreatingGroup && !isContributingToGroup && (
            <motion.div 
              className="mb-6 flex flex-wrap gap-3"
              variants={fadeIn}
            >
              <button 
                onClick={() => setIsCreatingGroup(true)}
                className="btn-primary py-3 px-6 rounded-xl flex items-center"
                disabled={isLoading}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Group Payment
              </button>
              
              <button 
                onClick={() => setIsContributingToGroup(true)}
                className="btn-secondary py-3 px-6 rounded-xl flex items-center"
                disabled={isLoading}
              >
                <UserPlusIcon className="w-5 h-5 mr-2" />
                Contribute to Payment
              </button>
            </motion.div>
          )}
          
          {/* Create Group Form */}
          {isCreatingGroup && (
            <motion.div 
              className="card backdrop-blur-lg p-6 mb-8"
              variants={fadeIn}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">Create Group Payment</h2>
                <button 
                  onClick={() => setIsCreatingGroup(false)}
                  className="text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
              
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Recipient Address</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-[rgb(var(--card))]/80 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50"
                    placeholder="0x..."
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Number of Participants</label>
                    <input
                      type="number"
                      value={participants}
                      onChange={(e) => setParticipants(e.target.value)}
                      className="w-full bg-[rgb(var(--card))]/80 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50"
                      placeholder="3"
                      min="2"
                      step="1"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Total Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-[rgb(var(--card))]/80 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50"
                        placeholder="0.0"
                        step="0.00001"
                        required
                        disabled={isLoading}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--muted-foreground))]">
                        <CurrencyDollarIcon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Description</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-[rgb(var(--card))]/80 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50 min-h-[80px]"
                    placeholder="What is this group payment for?"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    className="btn-primary py-3 px-4 rounded-xl w-full flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserGroupIcon className="w-5 h-5 mr-2" />
                        Create Group Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
          
          {/* Contribute to Group Form Popup */}
          {isContributingToGroup && (
            <motion.div 
              className="card backdrop-blur-lg p-6 mb-8"
              variants={fadeIn}
              initial="initial"
              animate="animate"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">
                  Contribute to Group Payment
                </h2>
                <button 
                  onClick={() => setIsContributingToGroup(false)}
                  className="text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
                  disabled={isLoading}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleContributeToId} className="space-y-4">
                <div>
                  <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Payment ID</label>
                  <input
                    type="text"
                    value={paymentIdToContribute}
                    onChange={handlePaymentIdChange}
                    className="w-full bg-[rgb(var(--card))]/80 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50 font-mono"
                    placeholder="0x..."
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Contribution Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="w-full bg-[rgb(var(--card))]/80 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50"
                      placeholder="0.0"
                      step="0.00001"
                      required
                      disabled={isLoading}
                    />
                    {isLoadingAmount && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--muted-foreground))]">
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                    {!isLoadingAmount && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--muted-foreground))]">
                        <span>{nativeToken}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                    Enter a valid Payment ID to automatically get the required contribution amount
                  </p>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    className="btn-primary py-3 px-4 rounded-xl w-full flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                        Contributing...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="w-5 h-5 mr-2" />
                        Contribute
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
          
          {/* Group Payments List */}
          <motion.div
            className="space-y-6"
            variants={staggerContainer}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">Active Group Payments</h2>
              <button 
                onClick={fetchGroupPayments}
                className="text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
                disabled={isRefreshing}
              >
                <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {groupPayments.length > 0 ? (
              groupPayments.map(payment => (
                <motion.div 
                  key={payment.paymentId}
                  className="card backdrop-blur-lg p-6"
                  variants={fadeIn}
                >
                  <div className="flex justify-between mb-3">
                    <h3 className="text-lg font-medium text-[rgb(var(--foreground))]">{payment.remarks || 'Group Payment'}</h3>
                    <div className="text-[rgb(var(--muted-foreground))] text-sm flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      Created: {formatDate(payment.timestamp)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="text-sm">
                      <p className="text-[rgb(var(--muted-foreground))] mb-1">Creator</p>
                      <p className="font-mono">{shortenAddress(payment.creator)}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-[rgb(var(--muted-foreground))] mb-1">Recipient</p>
                      <p className="font-mono">{shortenAddress(payment.recipient)}</p>
                    </div>
                  </div>
                  
                  {/* Payment ID with Copy Button */}
                  <div className="bg-[rgb(var(--card))]/50 p-3 rounded-lg border border-[rgb(var(--border))]/50 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm text-[rgb(var(--muted-foreground))]">Payment ID</div>
                      <motion.button
                        onClick={() => handleCopyId(payment.paymentId)}
                        className="text-xs text-[rgb(var(--primary))] hover:text-[rgb(var(--primary))]/80 transition-colors flex items-center space-x-1 px-2 py-1 rounded-lg bg-[rgb(var(--primary))]/10 hover:bg-[rgb(var(--primary))]/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="flex items-center space-x-1">
                          <ClipboardDocumentIcon className="w-4 h-4" />
                          <span>Copy ID</span>
                        </span>
                      </motion.button>
                    </div>
                    <div className="font-mono text-xs text-[rgb(var(--foreground))] break-all">
                      {payment.paymentId}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-[rgb(var(--foreground))]">
                        Progress: {payment.amountCollected} / {payment.totalAmount} {nativeToken}
                      </span>
                      <span className="text-[rgb(var(--primary))]">
                        {calculateProgress(payment.amountCollected, payment.totalAmount).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-[rgb(var(--muted))]/20 rounded-full h-2">
                      <div 
                        className="bg-[rgb(var(--primary))] h-2 rounded-full" 
                        style={{ width: `${calculateProgress(payment.amountCollected, payment.totalAmount)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-sm text-[rgb(var(--muted-foreground))] space-y-1 sm:space-y-0 sm:space-x-4">
                      <span>
                        <UserGroupIcon className="w-4 h-4 inline mr-1" />
                        {payment.numParticipants} participants needed
                      </span>
                      <span>
                        <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                        {payment.amountPerPerson} {nativeToken} per person
                      </span>
                    </div>
                    
                    <div className="flex space-x-2 w-full sm:w-auto">
                      {/* Contribute to Payment button */}
                      <button 
                        className={`${
                          userContributions[payment.paymentId] 
                            ? 'bg-[rgb(var(--muted))]/20 text-[rgb(var(--muted-foreground))]' 
                            : 'btn-primary'
                        } py-2 px-4 rounded-lg text-sm flex-1 sm:flex-none flex items-center justify-center`}
                        onClick={() => handleContribute(payment.paymentId, payment.amountPerPerson)}
                        disabled={isLoading || userContributions[payment.paymentId]}
                      >
                        {isLoading ? (
                          <ArrowPathIcon className="w-4 h-4 animate-spin inline" />
                        ) : userContributions[payment.paymentId] ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4 mr-1 inline" />
                            Contributed
                          </>
                        ) : (
                          <>
                            <UserGroupIcon className="w-4 h-4 mr-1 inline" />
                            Contribute
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                className="card backdrop-blur-lg p-8 text-center"
                variants={fadeIn}
              >
                <UserGroupIcon className="w-16 h-16 text-[rgb(var(--primary))] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Groups</h3>
                <p className="text-[rgb(var(--muted-foreground))] mb-4">
                  Create your first group payment to get started.
                </p>
              </motion.div>
            )}
          </motion.div>
        </>
      )}

      {/* Copy Notification Toast */}
      {copiedPaymentId && (
        <motion.div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] px-4 py-2 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          Payment ID copied to clipboard!
        </motion.div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRightIcon,
  ClockIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  UsersIcon,
  UserCircleIcon,
  ExclamationCircleIcon,
  ArrowUturnLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { shortenAddress } from '../../../utils/address'
import { 
  getUserProfile, 
  getUserByAddress,
  handleContractError,
  getUserTransfers,
  getGroupPaymentDetails,
  getSavingsPotDetails
} from '../../../utils/contract'
import { useWallet } from '@/context/WalletContext'
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

interface TransactionItem {
  id: string;
  type: 'transfer' | 'group_payment' | 'savings_pot';
  subtype: string;
  timestamp: number;
  amount: string;
  status: number;
  otherParty?: string;
  description?: string;
}

export default function HistoryPage() {
  const { address, isConnected } = useAccount()
  const { nativeToken } = useChain();
  const { signer } = useWallet()
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'transfer' | 'group_payment' | 'savings_pot'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5 // Show only 5 transactions per page

  // Fetch user data and transaction history
  const fetchTransactionData = useCallback(async () => {
    if (!signer || !address) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Get transfer history
      const transfersData = await getUserTransfers(signer, address)
      let allTransactions: TransactionItem[] = []
      
      // Process transfer transactions
      if (transfersData && transfersData.length > 0) {
        const transferTransactions = transfersData.map((transfer: any) => {
          const isSender = transfer.sender.toLowerCase() === address.toLowerCase()
          return {
            id: transfer.id || `transfer-${Date.now()}-${Math.random()}`,
            type: 'transfer',
            subtype: isSender ? 'sent' : 'received',
            timestamp: transfer.timestamp,
            amount: transfer.amount,
            status: transfer.status,
            otherParty: isSender ? transfer.recipient : transfer.sender,
            description: transfer.remarks
          } as TransactionItem
        })
        allTransactions = [...allTransactions, ...transferTransactions]
      }
      
      // Get group payment data
      try {
        const profile = await getUserProfile(signer, address)
        if (profile && profile.groupPaymentIds && profile.groupPaymentIds.length > 0) {
          const groupPaymentPromises = profile.groupPaymentIds.map((paymentId: string) => 
            getGroupPaymentDetails(signer, paymentId)
          )
          
          const groupPaymentDetails = await Promise.all(groupPaymentPromises)
          const groupPaymentTransactions = groupPaymentDetails.map((payment: any) => {
            const isCreator = payment.creator && payment.creator.toLowerCase() === address.toLowerCase()
            const isRecipient = payment.recipient && payment.recipient.toLowerCase() === address.toLowerCase()
            
            return {
              id: payment.id || `group-${Date.now()}-${Math.random()}`,
              type: 'group_payment',
              subtype: isCreator ? 'created' : isRecipient ? 'received' : 'contributed',
              timestamp: payment.timestamp,
              amount: payment.totalAmount || payment.amountCollected || '0',
              status: payment.status,
              otherParty: isCreator ? payment.recipient : payment.creator,
              description: payment.remarks
            } as TransactionItem
          })
          
          allTransactions = [...allTransactions, ...groupPaymentTransactions]
        }
      } catch (err) {
        console.error('Error fetching group payments:', err)
      }
      
      // Get savings pot data
      try {
        const profile = await getUserProfile(signer, address)
        if (profile && profile.savingsPotIds && profile.savingsPotIds.length > 0) {
          const savingsPotPromises = profile.savingsPotIds.map((potId: string) => 
            getSavingsPotDetails(signer, potId)
          )
          
          const savingsPotsDetails = await Promise.all(savingsPotPromises)
          const savingsPotTransactions = savingsPotsDetails.map((pot: any) => {
            return {
              id: pot.id || `pot-${Date.now()}-${Math.random()}`,
              type: 'savings_pot',
              subtype: pot.status === 0 ? 'active' : pot.status === 1 ? 'completed' : 'broken',
              timestamp: pot.timestamp,
              amount: pot.currentAmount || '0',
              status: pot.status,
              description: pot.name
            } as TransactionItem
          })
          
          allTransactions = [...allTransactions, ...savingsPotTransactions]
        }
      } catch (err) {
        console.error('Error fetching savings pots:', err)
      }
      
      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp)
      setTransactions(allTransactions)
      
    } catch (err) {
      console.error('Error fetching transaction data:', err)
      setError(handleContractError(err))
    } finally {
      setIsLoading(false)
    }
  }, [signer, address])
  
  // Fetch data when signer/address changes
  useEffect(() => {
    if (signer && address) {
      fetchTransactionData()
    }
  }, [signer, address, fetchTransactionData])
  
  // Filter transactions based on active filter
  const filteredTransactions = useMemo(() => {
    return activeFilter === 'all' 
      ? transactions 
      : transactions.filter(tx => tx.type === activeFilter)
  }, [transactions, activeFilter])

  // Calculate pagination values
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  
  // Get current page transactions
  const currentTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredTransactions, currentPage, itemsPerPage])

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter])
  
  // Format date to readable string
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000) // Convert to milliseconds
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Get status text
  const getStatusText = (type: string, status: number) => {
    if (type === 'transfer') {
      switch (status) {
        case 0: return 'Pending'
        case 1: return 'Completed'
        case 2: return 'Refunded'
        default: return 'Unknown'
      }
    }
    
    if (type === 'group_payment') {
      switch (status) {
        case 0: return 'In Progress'
        case 1: return 'Completed'
        case 2: return 'Cancelled'
        default: return 'Unknown'
      }
    }
    
    if (type === 'savings_pot') {
      switch (status) {
        case 0: return 'Active'
        case 1: return 'Completed'
        case 2: return 'Broken'
        default: return 'Unknown'
      }
    }
    
    return 'Unknown'
  }
  
  // Get status color classes
  const getStatusClasses = (type: string, status: number) => {
    if (status === 0) {
      return 'bg-yellow-500/20 text-yellow-500 dark:text-yellow-400'
    } else if (status === 1) {
      return 'bg-green-500/20 text-green-500 dark:text-green-400'
    } else if (status === 2) {
      if (type === 'savings_pot') { // Broken pot
        return 'bg-orange-500/20 text-orange-500 dark:text-orange-400'
      } else { // Refunded/cancelled
        return 'bg-red-500/20 text-red-500 dark:text-red-400'
      }
    }
    return 'bg-gray-500/20 text-gray-500 dark:text-gray-400'
  }
  
  // Get icon based on transaction type
  const getTransactionIcon = (transaction: TransactionItem) => {
    if (transaction.type === 'transfer') {
      if (transaction.subtype === 'sent') {
        return <ArrowRightIcon className="w-5 h-5" />
      } else if (transaction.subtype === 'received') {
        return <ArrowRightIcon className="w-5 h-5 transform rotate-180" />
      }
    } else if (transaction.type === 'group_payment') {
      return <UsersIcon className="w-5 h-5" />
    } else if (transaction.type === 'savings_pot') {
      return <BanknotesIcon className="w-5 h-5" />
    }
    
    return <ShieldCheckIcon className="w-5 h-5" />
  }
  
  // Get transaction background color
  const getTransactionBg = (transaction: TransactionItem) => {
    if (transaction.type === 'transfer') {
      if (transaction.subtype === 'sent') {
        return 'bg-blue-500/20 text-blue-500 dark:text-blue-400'
      } else {
        return 'bg-green-500/20 text-green-500 dark:text-green-400'
      }
    } else if (transaction.type === 'group_payment') {
      return 'bg-purple-500/20 text-purple-500 dark:text-purple-400'
    } else if (transaction.type === 'savings_pot') {
      return 'bg-orange-500/20 text-orange-500 dark:text-orange-400'
    }
    
    return 'bg-gray-500/20 text-gray-500 dark:text-gray-400'
  }
  
  // Get transaction description
  const getTransactionTitle = (transaction: TransactionItem) => {
    if (transaction.type === 'transfer') {
      if (transaction.subtype === 'sent') {
        return `Sent to ${transaction.otherParty ? shortenAddress(transaction.otherParty) : 'Unknown'}`
      } else {
        return `Received from ${transaction.otherParty ? shortenAddress(transaction.otherParty) : 'Unknown'}`
      }
    } else if (transaction.type === 'group_payment') {
      if (transaction.subtype === 'created') {
        return `Created Group Payment (${transaction.otherParty ? 'for ' + shortenAddress(transaction.otherParty) : ''})`
      } else if (transaction.subtype === 'received') {
        return `Received Group Payment (from ${transaction.otherParty ? shortenAddress(transaction.otherParty) : 'Group'})`
      } else {
        return `Contributed to Group Payment`
      }
    } else if (transaction.type === 'savings_pot') {
      return `Savings Pot: ${transaction.description || 'Unnamed Pot'}`
    }
    
    return 'Unknown Transaction'
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <motion.div 
        className="mb-8"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-2">Transaction History</h1>
        <p className="text-[rgb(var(--muted-foreground))]">
          View and track your transaction history across all payment methods
        </p>
      </motion.div>

      {/* Error Notification */}
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

      {!isConnected ? (
        <motion.div 
          className="card backdrop-blur-lg p-8 text-center"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <UserCircleIcon className="w-16 h-16 text-[rgb(var(--primary))] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            Please connect your wallet to view your transaction history.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Filter Tabs */}
          <motion.div 
            className="card backdrop-blur-lg p-4 border border-[rgb(var(--border))]/50"
            variants={fadeIn}
          >
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === 'all' 
                    ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' 
                    : 'bg-[rgb(var(--muted))]/20 text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]/30'
                }`}
              >
                All Transactions
              </button>
              
              <button
                onClick={() => setActiveFilter('transfer')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === 'transfer' 
                    ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' 
                    : 'bg-[rgb(var(--muted))]/20 text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]/30'
                }`}
              >
                Transfers
              </button>
              
              <button
                onClick={() => setActiveFilter('group_payment')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === 'group_payment' 
                    ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' 
                    : 'bg-[rgb(var(--muted))]/20 text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]/30'
                }`}
              >
                Group Payments
              </button>
              
              <button
                onClick={() => setActiveFilter('savings_pot')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === 'savings_pot' 
                    ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' 
                    : 'bg-[rgb(var(--muted))]/20 text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]/30'
                }`}
              >
                Savings Pots
              </button>
              
              <button
                onClick={fetchTransactionData}
                className="ml-auto text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
                disabled={isLoading}
              >
                <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </motion.div>
          
          {/* Transaction List */}
          <motion.div
            className="card backdrop-blur-lg p-6 border border-[rgb(var(--border))]/50"
            variants={fadeIn}
          >
            <h2 className="text-xl font-semibold mb-5 text-[rgb(var(--foreground))]">
              {activeFilter === 'all' ? 'All Transactions' : 
               activeFilter === 'transfer' ? 'Transfers' :
               activeFilter === 'group_payment' ? 'Group Payments' : 'Savings Pots'}
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <ArrowPathIcon className="w-8 h-8 text-[rgb(var(--primary))] animate-spin" />
              </div>
            ) : currentTransactions.length > 0 ? (
              <div className="space-y-4">
                {currentTransactions.map((transaction) => (
                  <motion.div 
                    key={transaction.id}
                    className="border border-[rgb(var(--border))]/30 rounded-xl p-4 hover:border-[rgb(var(--border))]/50 transition-colors"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg mt-1 ${getTransactionBg(transaction)}`}>
                          {getTransactionIcon(transaction)}
                        </div>
                        
                        <div>
                          <p className="font-medium text-[rgb(var(--foreground))]">
                            {getTransactionTitle(transaction)}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[rgb(var(--muted-foreground))]">
                            <span className="inline-flex items-center">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {formatDate(transaction.timestamp)}
                            </span>
                            
                            <span className={`px-2 py-0.5 rounded-full ${getStatusClasses(transaction.type, transaction.status)}`}>
                              {getStatusText(transaction.type, transaction.status)}
                            </span>
                          </div>
                          
                          {transaction.description && (
                            <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))] bg-[rgb(var(--muted))]/10 p-2 rounded">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-[rgb(var(--foreground))]">
                          {transaction.amount} {nativeToken}
                        </p>
                        
                        <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                          {transaction.type === 'transfer' ? 'Transfer' : 
                           transaction.type === 'group_payment' ? 'Group Payment' : 
                           'Savings Pot'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Pagination Controls */}
                {filteredTransactions.length > itemsPerPage && (
                  <div className="flex items-center justify-between mt-6 border-t border-[rgb(var(--border))]/30 pt-4">
                    <button 
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm ${
                        currentPage === 1 
                          ? 'text-[rgb(var(--muted-foreground))] cursor-not-allowed' 
                          : 'text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]/20'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>
                    
                    <div className="text-sm text-[rgb(var(--muted-foreground))]">
                      Page <span className="font-medium text-[rgb(var(--foreground))]">{currentPage}</span> of{' '}
                      <span className="font-medium text-[rgb(var(--foreground))]">{totalPages}</span>
                    </div>
                    
                    <button 
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm ${
                        currentPage === totalPages 
                          ? 'text-[rgb(var(--muted-foreground))] cursor-not-allowed' 
                          : 'text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]/20'
                      }`}
                    >
                      <span>Next</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <ShieldCheckIcon className="w-16 h-16 text-[rgb(var(--primary))] mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                <p className="text-[rgb(var(--muted-foreground))]">
                  {activeFilter === 'all' 
                    ? "You don't have any transactions yet" 
                    : `You don't have any ${activeFilter.replace('_', ' ')} transactions yet`}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

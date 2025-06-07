'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  BanknotesIcon,
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  FlagIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { 
  createSavingsPot, 
  contributeToSavingsPot, 
  breakPot, 
  getSavingsPotDetails, 
  getUserProfile,
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

interface SavingsPot {
  id: string;
  potId: string;
  owner: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  timestamp: number;
  status: number;
  remarks: string;
}

export default function SavingsPotsPage() {
  const { address, isConnected } = useAccount()
  const { nativeToken } = useChain();
  const [isCreatingPot, setIsCreatingPot] = useState(false)
  const [potName, setPotName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [savingsPots, setSavingsPots] = useState<SavingsPot[]>([])
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [breakingPotId, setBreakingPotId] = useState<string | null>(null)
  const [depositingPotId, setDepositingPotId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [showDepositModal, setShowDepositModal] = useState(false)
  
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
  
  // Fetch savings pots
  const fetchSavingsPots = useCallback(async () => {
    if (!signer || !address) return
    
    try {
      setIsRefreshing(true)
      const profile = await getUserProfile(signer, address)
      
      if (!profile || !profile.savingsPotIds || profile.savingsPotIds.length === 0) {
        setSavingsPots([])
        return
      }
      
      const pots = await Promise.all(
        profile.savingsPotIds.map(async (id) => {
          try {
            const pot = await getSavingsPotDetails(signer, id)
            return pot
          } catch (err) {
            console.error(`Error fetching pot ${id}:`, err)
            return null
          }
        })
      )
      
      // Filter out nulls and sort by timestamp (newest first)
      const validPots = pots
        .filter((pot): pot is SavingsPot => pot !== null)
        .sort((a, b) => b.timestamp - a.timestamp)
      
      setSavingsPots(validPots)
    } catch (err) {
      console.error('Error fetching savings pots:', err)
      setError(handleContractError(err))
    } finally {
      setIsRefreshing(false)
    }
  }, [signer, address])
  
  // Fetch pots when signer/address changes
  useEffect(() => {
    if (signer && address) {
      fetchSavingsPots()
    }
  }, [signer, address, fetchSavingsPots])
  
  const handleCreatePot = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signer) {
      setError('Please connect your wallet to create a savings pot')
      return
    }
    
    if (!potName) {
      setError('Please enter a pot name')
      return
    }
    
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError('Please enter a valid target amount')
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const tx = await createSavingsPot(
        signer,
        potName,
        targetAmount,
        remarks || 'Savings Pot'
      )
      
      await tx
      setSuccess('Savings pot created successfully!')
      fetchSavingsPots()
      
      // Reset form values
      setPotName('')
      setTargetAmount('')
      setRemarks('')
      setIsCreatingPot(false)
    } catch (err) {
      console.error('Error creating savings pot:', err)
      setError(handleContractError(err))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signer) {
      setError('Please connect your wallet to make a deposit')
      return
    }
    
    if (!depositingPotId) {
      setError('No pot selected for deposit')
      return
    }
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid deposit amount')
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const tx = await contributeToSavingsPot(signer, depositingPotId, depositAmount)
      
      await tx
      setSuccess('Deposit successful!')
      fetchSavingsPots()
      
      // Reset deposit form
      setDepositAmount('')
      setDepositingPotId(null)
      setShowDepositModal(false)
    } catch (err) {
      console.error('Error depositing to pot:', err)
      setError(handleContractError(err))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleBreakPot = async (potId: string) => {
    if (!signer) {
      setError('Please connect your wallet to withdraw')
      return
    }
    
    setIsLoading(true)
    setBreakingPotId(potId)
    setError('')
    setSuccess('')
    
    try {
      const tx = await breakPot(signer, potId)
      
      await tx
      setSuccess('Pot withdrawn successfully!')
      fetchSavingsPots()
    } catch (err) {
      console.error('Error breaking pot:', err)
      setError(handleContractError(err))
    } finally {
      setIsLoading(false)
      setBreakingPotId(null)
    }
  }
  
  // Calculate progress percentage
  const calculateProgress = (current: string, target: string) => {
    const currentValue = parseFloat(current)
    const targetValue = parseFloat(target)
    if (isNaN(currentValue) || isNaN(targetValue) || targetValue === 0) return 0
    return Math.min(100, (currentValue / targetValue) * 100)
  }
  
  // Format date to readable string
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000) // Convert to milliseconds
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    })
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
        <h1 className="text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-2">Savings Pots</h1>
        <p className="text-[rgb(var(--muted-foreground))]">
          Create and manage goal-based savings
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

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div 
            className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Deposit to Savings Pot</h3>
              <button 
                onClick={() => {
                  setShowDepositModal(false)
                  setDepositingPotId(null)
                  setDepositAmount('')
                }}
                className="text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleDeposit}>
              <div className="mb-4">
                <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Amount to Deposit</label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-4 py-2 text-[rgb(var(--foreground))]"
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
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDepositModal(false)
                    setDepositingPotId(null)
                    setDepositAmount('')
                  }}
                  className="px-4 py-2 rounded-lg bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin inline" />
                      Depositing...
                    </>
                  ) : (
                    'Confirm Deposit'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
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
            Please connect your wallet to create or manage savings pots.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Create Pot Button */}
          {!isCreatingPot && (
            <motion.div 
              className="mb-6"
              variants={fadeIn}
              initial="initial"
              animate="animate"
            >
              <button 
                onClick={() => setIsCreatingPot(true)}
                className="btn-primary py-3 px-6 rounded-xl flex items-center"
                disabled={isLoading}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Savings Pot
              </button>
            </motion.div>
          )}
          
          {/* Create Pot Form */}
          {isCreatingPot && (
            <motion.div 
              className="card backdrop-blur-lg p-6 mb-8"
              variants={fadeIn}
              initial="initial"
              animate="animate"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">Create Savings Pot</h2>
                <button 
                  onClick={() => setIsCreatingPot(false)}
                  className="text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
              
              <form onSubmit={handleCreatePot} className="space-y-4">
                <div>
                  <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Pot Name</label>
                  <input
                    type="text"
                    value={potName}
                    onChange={(e) => setPotName(e.target.value)}
                    className="w-full bg-[rgb(var(--card))]/80 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50"
                    placeholder="e.g. Vacation Fund"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Goal Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
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
                
                <div>
                  <label className="block text-[rgb(var(--muted-foreground))] mb-2 text-sm">Description</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-[rgb(var(--card))]/80 border border-[rgb(var(--border))]/50 rounded-xl px-4 py-3 text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]/50 min-h-[80px]"
                    placeholder="What are you saving for?"
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
                        <BanknotesIcon className="w-5 h-5 mr-2" />
                        Create Savings Pot
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
          
          {/* Savings Pots Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">Your Savings Pots</h2>
              <button 
                onClick={fetchSavingsPots}
                className="text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
                disabled={isRefreshing}
              >
                <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {savingsPots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savingsPots.map(pot => (
                  <motion.div 
                    key={pot.potId}
                    className="card backdrop-blur-lg p-6"
                    variants={fadeIn}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-[rgb(var(--foreground))]">{pot.name}</h3>
                        <p className="text-sm text-[rgb(var(--muted-foreground))]">{pot.remarks}</p>
                      </div>
                      <div className="bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] px-2 py-1 rounded text-xs">
                        {pot.status === 0 ? 'Active' : pot.status === 1 ? 'Complete' : 'Broken'}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-4 mt-6">
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-[rgb(var(--foreground))]">{pot.currentAmount} / {pot.targetAmount} {nativeToken}</span>
                        <span className="text-[rgb(var(--primary))]">{calculateProgress(pot.currentAmount, pot.targetAmount).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-[rgb(var(--muted))]/20 rounded-full h-3">
                        <div 
                          className="bg-[rgb(var(--primary))] h-3 rounded-full" 
                          style={{ width: `${calculateProgress(pot.currentAmount, pot.targetAmount)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-[rgb(var(--muted-foreground))] mb-4">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        Created: {formatDate(pot.timestamp)}
                      </div>
                      <div className="flex items-center">
                        <FlagIcon className="w-4 h-4 mr-1" />
                        Target: {pot.targetAmount} {nativeToken}
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <button 
                        className="bg-white dark:bg-black/50 text-[rgb(var(--foreground))] border border-[rgb(var(--border))] py-2 px-3 rounded-lg text-sm flex items-center"
                        onClick={() => handleBreakPot(pot.potId)}
                        disabled={isLoading || breakingPotId === pot.potId || pot.status !== 0}
                      >
                        {breakingPotId === pot.potId ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                            Withdrawing...
                          </>
                        ) : (
                          'Withdraw'
                        )}
                      </button>
                      <button 
                        className="btn-primary py-2 px-3 rounded-lg text-sm flex items-center"
                        onClick={() => {
                          setDepositingPotId(pot.potId)
                          setShowDepositModal(true)
                        }}
                        disabled={isLoading || pot.status !== 0}
                      >
                        Deposit
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                className="card backdrop-blur-lg p-8 text-center"
                variants={fadeIn}
              >
                <BanknotesIcon className="w-16 h-16 text-[rgb(var(--primary))] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Savings Pots Yet</h3>
                <p className="text-[rgb(var(--muted-foreground))] mb-4">
                  Create your first savings pot to start reaching your financial goals.
                </p>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}

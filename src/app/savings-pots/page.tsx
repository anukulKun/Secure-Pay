'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PlusCircleIcon, 
  ArrowPathIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  SparklesIcon,
  CheckCircleIcon,
  ChartBarIcon,
  LockClosedIcon,
  ArrowUpIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { useWallet } from '@/context/WalletContext'
import { 
  createSavingsPot,
  contributeToSavingsPot,
  breakPot,
  getSavingsPotDetails,
  getUserProfile
} from '@/utils/contract'
import type { SavingsPot, RawContractPot, TabButtonProps, PotCardProps } from '@/types/interfaces'
import { LoadingSpinner } from '@/components/Loading'
import { 
  formatDate, 
  calculateProgress, 
  truncateAddress, 
  formatAmount,
  handleError 
} from '@/utils/helpers'
import { 
  POT_STATUS_LABELS, 
  POT_STATUS_COLORS
} from '@/utils/constants'
import { useChainInfo } from '@/utils/useChainInfo';

const pageTransition = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

const containerAnimation = {
  initial: "initial",
  animate: "animate",
  exit: "exit",
  variants: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { when: "beforeChildren", staggerChildren: 0.15 }
    },
    exit: {
      opacity: 0,
      transition: { when: "afterChildren", staggerChildren: 0.1 }
    }
  }
}

const itemAnimation = {
  initial: { y: 20, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { 
    y: 20, 
    opacity: 0,
    transition: { duration: 0.3 }
  }
}

const formatPot = (pot: RawContractPot, id: string): SavingsPot => ({
  id,
  potId: id,
  owner: pot.owner,
  name: pot.name,
  targetAmount: pot.targetAmount,
  currentAmount: pot.currentAmount,
  timestamp: Math.floor(Number(pot.timestamp)),
  status: Number(pot.status),
  remarks: pot.remarks
})

export default function SavingsPotsPage() {
  const { address, signer } = useWallet()
  const [activeTab, setActiveTab] = useState('create')
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [savingsPots, setSavingsPots] = useState<SavingsPot[]>([])
  const { currentChain } = useChainInfo();

  const fetchSavingsPots = useCallback(async () => {
    if (!signer || !address) return;
    setIsFetching(true);
    try {
      const profile = await getUserProfile(signer, address);
      const potPromises = profile.savingsPotIds.map(async (id) => {
        const pot = await getSavingsPotDetails(signer, id);
        return formatPot(pot as RawContractPot, id);
      });
      const pots = await Promise.all(potPromises);
      setSavingsPots(pots);
    } catch (err) {
      console.error('Failed to fetch savings pots:', err);
      setError(handleError(err));
    } finally {
      setIsFetching(false);
    }
  }, [signer, address]);

  useEffect(() => {
      fetchSavingsPots();
  }, [fetchSavingsPots]);

  const resetForm = () => {
    setName('')
    setTargetAmount('')
    setRemarks('')
    setError('')
    setSuccess('')
  }

  const handleCreatePot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signer) {
      setError('Please connect your wallet first')
      return
    }

    if (!name || !targetAmount || !remarks) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      await createSavingsPot(signer, name, targetAmount, remarks)
      setSuccess('Savings pot created successfully!')
      resetForm()
      fetchSavingsPots()
    } catch (err) {
      setError(handleError(err))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContribute = async (potId: string, amount: string) => {
    if (!signer) return
    setIsLoading(true)
    try {
      await contributeToSavingsPot(signer, potId, amount)
      setSuccess('Contribution successful!')
      fetchSavingsPots()
    } catch (err) {
      setError(handleError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleBreak = async (potId: string) => {
    if (!signer) return
    setIsLoading(true)
    try {
      await breakPot(signer, potId)
      setSuccess('Pot broken successfully!')
      fetchSavingsPots()
    } catch (err) {
      setError(handleError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-black to-green-950">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none" />
      
      <motion.div 
        className="container mx-auto px-4 py-20 relative z-10"
        {...containerAnimation}
      >
        {/* Hero Section */}
        <motion.div variants={itemAnimation} className="text-center mb-16 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(16, 185, 129, 0.2)",
                "0 0 60px rgba(16, 185, 129, 0.4)",
                "0 0 20px rgba(16, 185, 129, 0.2)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-6 bg-black/30 p-6 rounded-2xl backdrop-blur-xl border border-green-500/10"
          >
            <CurrencyDollarIcon className="w-16 h-16 mx-auto text-green-400" />
          </motion.div>
          
          <h1 className="text-6xl font-bold mb-6 relative">
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-green-500 text-transparent bg-clip-text">
              Savings Pots
            </span>
            <motion.span
              className="absolute -top-2 -right-2 text-2xl"
              animate={{ rotate: [0, 20, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ✨
            </motion.span>
          </h1>
          
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Create secure savings goals and watch your dreams grow into reality
          </p>

          <div className="flex justify-center gap-6">
            <motion.div
              variants={itemAnimation}
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex items-center space-x-3 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/10"
            >
              <ChartBarIcon className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Track Progress</span>
            </motion.div>
            <motion.div
              variants={itemAnimation}
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex items-center space-x-3 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/10"
            >
              <LockClosedIcon className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Secure Storage</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemAnimation} className="flex justify-center space-x-6 mb-12">
          <TabButton
            isActive={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
            icon={<PlusCircleIcon className="w-5 h-5" />}
            text="Create New Pot"
          />
          <TabButton
            isActive={activeTab === 'my-pots'}
            onClick={() => setActiveTab('my-pots')}
            icon={<SparklesIcon className="w-5 h-5" />}
            text="My Savings Pots"
            count={savingsPots.length}
          />
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'create' ? (
            <motion.div 
              key="create-form"
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-xl mx-auto"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl blur-xl" />
                <div className="relative bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-green-500/20">
                  <form onSubmit={handleCreatePot} className="space-y-6">
                    <div>
                      <label className="block mb-2 text-green-400 font-medium">Pot Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all duration-200"
                        placeholder="Summer Vacation"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-green-400 font-medium">Target Amount ({currentChain.symbol})</label>
                      <input
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all duration-200"
                        placeholder="0.0"
                        step="0.000000000000000001"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-green-400 font-medium">Remarks</label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all duration-200"
                        placeholder="What are you saving for?"
                        rows={3}
                        required
                      />
                    </div>

                    {error && (
                      <motion.div 
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {error}
                      </motion.div>
                    )}

                    {success && (
                      <motion.div 
                        className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {success}
                      </motion.div>
                    )}

                    <motion.button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all duration-200"
                      disabled={isLoading || !signer}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          <span>Creating Pot...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircleIcon className="w-5 h-5" />
                          <span>Create Savings Pot</span>
                        </>
                      )}
                    </motion.button>

                    {!signer && (
                      <p className="text-center text-gray-400 text-sm">
                        Connect your wallet to create savings pots
                      </p>
                    )}
                  </form>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pots-list"
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-4xl mx-auto"
            >
              {isFetching ? (
                <LoadingSpinner />
              ) : savingsPots.length === 0 ? (
                <motion.div 
                  className="text-center bg-black/40 backdrop-blur-xl p-12 rounded-2xl border border-green-500/20"
                  variants={itemAnimation}
                >
                  <CurrencyDollarIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No Savings Pots Yet</h3>
                  <p className="text-gray-500">Create your first savings pot to start saving!</p>
                </motion.div>
              ) : (
                <div className="grid gap-6">
                  {savingsPots.map((pot) => (
                    <PotCard
                      key={pot.id}
                      pot={pot}
                      onContribute={handleContribute}
                      onBreak={handleBreak}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, icon, text, count }) => (
  <motion.button
    onClick={onClick}
    className={`
      relative px-6 py-3 rounded-xl font-medium
      transition-all duration-300 ease-out
      ${isActive 
        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/25' 
        : 'bg-black/40 backdrop-blur-xl border border-green-500/20 text-white hover:border-green-500/40'
      }
    `}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-center space-x-2">
      {icon}
      <span>{text}</span>
      {count !== undefined && (
        <motion.span 
          className={`
            px-2 py-0.5 rounded-full text-xs
            ${isActive ? 'bg-black/20' : 'bg-green-500/20'}
          `}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          {count}
        </motion.span>
      )}
    </div>
    {isActive && (
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-xl -z-10"
        layoutId="activeTab"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
  </motion.button>
);

const PotCard: React.FC<PotCardProps> = ({ pot, onContribute, onBreak, isLoading }) => {
  const [showContribute, setShowContribute] = useState(false)
  const [amount, setAmount] = useState('')
  const progress = calculateProgress(pot.currentAmount, pot.targetAmount)
  const { currentChain } = useChainInfo();

  return (
    <motion.div 
      variants={itemAnimation}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-green-500/20 group-hover:border-green-500/40 transition-all duration-300">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-green-400 mb-1">{pot.name}</h3>
            <p className="text-gray-400 text-sm flex items-center space-x-2">
              <span>By {truncateAddress(pot.owner)}</span>
              <span className="inline-block w-1 h-1 rounded-full bg-gray-500" />
              <span>{formatDate(pot.timestamp)}</span>
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm ${
            POT_STATUS_COLORS[pot.status as keyof typeof POT_STATUS_COLORS]
          }`}>
            {POT_STATUS_LABELS[pot.status as keyof typeof POT_STATUS_LABELS]}
          </span>
        </div>

        <div className="mb-6">
          <div className="h-3 bg-black/50 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-400">{Math.round(progress)}% saved</span>
            <span className="text-green-400 font-medium">
              {formatAmount(pot.currentAmount)} / {formatAmount(pot.targetAmount)} {currentChain.symbol}
            </span>
          </div>
        </div>

        {pot.remarks && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/5 border border-green-500/10">
            <p className="text-gray-400 text-sm">{pot.remarks}</p>
          </div>
        )}

        {pot.status === 0 && (
          <div className="space-y-4">
            {showContribute ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition-all duration-200"
                  placeholder={`Amount in ${currentChain.symbol}`}
                  step="0.000000000000000001"
                />
                <div className="flex space-x-3">
                  <motion.button
                    onClick={() => {
                      onContribute(pot.id, amount);
                      setShowContribute(false);
                      setAmount('');
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-black px-4 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all duration-200"
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
                        <span>Confirm Contribution</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowContribute(false);
                      setAmount('');
                    }}
                    className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-red-500/20 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <XCircleIcon className="w-5 h-5" />
                    <span>Cancel</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <div className="flex space-x-3">
                <motion.button
                  onClick={() => setShowContribute(true)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-black px-4 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:brightness-110 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowUpIcon className="w-5 h-5" />
                  <span>Contribute</span>
                </motion.button>
                <motion.button
                  onClick={() => onBreak(pot.id)}
                  className="flex-1 bg-black/40 backdrop-blur-xl border border-red-500/20 text-red-400 px-4 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-red-500/10 transition-all duration-200"
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
                      <FireIcon className="w-5 h-5" />
                      <span>Break Pot</span>
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>
        )}

        {/* Progress Indicator */}
        {progress >= 100 && pot.status === 0 && (
          <motion.div 
            className="absolute -top-2 -right-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
              delay: 0.5
            }}
          >
            <div className="bg-green-500 text-black p-2 rounded-full shadow-lg shadow-green-500/25">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
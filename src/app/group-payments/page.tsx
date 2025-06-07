// group-payments/page.tsx:

"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UsersIcon,
  ArrowPathIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  ChatBubbleBottomCenterTextIcon,
  ClipboardDocumentIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useWallet } from '@/context/WalletContext'
import { 
  createGroupPayment,
  contributeToGroupPayment,
  getGroupPaymentDetails,
  getUserProfile
} from '@/utils/contract'
import type { GroupPayment, RawContractPayment } from '@/types/interfaces'
import { LoadingSpinner } from '@/components/Loading'
import { 
  formatAmount,
  truncateAddress,
  handleError
} from '@/utils/helpers'
import { getPaymentAmount } from '@/utils/contract'
import { useChainInfo } from '@/utils/useChainInfo';

const pageTransition = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
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

enum PaymentTabs {
  CREATE = 'create',
  CONTRIBUTE = 'contribute',
  MY_PAYMENTS = 'my-payments'
}

const formatPayment = (payment: RawContractPayment, id: string): GroupPayment => ({
  id,
  paymentId: id,
  creator: payment.creator,
  recipient: payment.recipient,
  totalAmount: payment.totalAmount,
  amountPerPerson: payment.amountPerPerson,
  numParticipants: Number(payment.numParticipants),
  amountCollected: payment.amountCollected,
  timestamp: Math.floor(Number(payment.timestamp)),
  status: Number(payment.status),
  remarks: payment.remarks
})

export default function GroupPaymentsPage() {
  const { address, signer } = useWallet()
  const [activeTab, setActiveTab] = useState<PaymentTabs>(PaymentTabs.CREATE)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [participants, setParticipants] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [myGroupPayments, setMyGroupPayments] = useState<GroupPayment[]>([])
  const [availablePayments, setAvailablePayments] = useState<GroupPayment[]>([])
  const [paymentId, setPaymentId] = useState('')
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);
  const { currentChain } = useChainInfo();

  const handlePaymentIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    setPaymentId(id);
    
    if (id.length === 66 && id.startsWith('0x')) { // Valid payment ID format
      try {
        const amountValue = await getPaymentAmount(signer!, id);
        setAmount(amountValue);
      } catch (error) {
        console.error('Error fetching payment amount:', error);
        setError('Invalid payment ID or payment not found');
      }
    }
  };

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

  const fetchGroupPayments = useCallback(async () => {
    if (!signer || !address) return
    setIsFetching(true)
    try {
      const profile = await getUserProfile(signer, address)
      const payments = await Promise.all(
        profile.groupPaymentIds.map(async (id) => {
          const payment = await getGroupPaymentDetails(signer, id)
          return formatPayment(payment as RawContractPayment, id)
        })
      )
      setMyGroupPayments(payments)

      const participatingPayments = await Promise.all(
        profile.participatedGroupPayments.map(async (id) => {
          const payment = await getGroupPaymentDetails(signer, id)
          return formatPayment(payment as RawContractPayment, id)
        })
      )
      setAvailablePayments(participatingPayments)
    } catch (err) {
      console.error('Failed to fetch group payments:', err)
      setError(handleError(err))
    } finally {
      setIsFetching(false)
    }
  }, [signer, address])

  useEffect(() => {
    fetchGroupPayments()
  }, [fetchGroupPayments])

  const resetForm = () => {
    setRecipient('')
    setAmount('')
    setParticipants('')
    setRemarks('')
    setError('')
    setSuccess('')
  }

  const handleTabChange = (tab: PaymentTabs) => {
    setActiveTab(tab)
    resetForm()
  }

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signer) {
      setError('Please connect your wallet first')
      return
    }

    if (!recipient || !amount || !participants || !remarks) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const numParticipants = parseInt(participants)
      await createGroupPayment(
        signer,
        recipient,
        numParticipants,
        amount,
        remarks
      )
      setSuccess('Group payment created successfully!')
      resetForm()
      fetchGroupPayments()
    } catch (err) {
      setError(handleError(err))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContribute = async (paymentId: string, amount: string) => {
    if (!signer) return
    setIsLoading(true)
    try {
      await contributeToGroupPayment(signer, paymentId, amount)
      setSuccess('Contribution successful!')
      fetchGroupPayments()
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
              <UsersIcon className="w-16 h-16 text-green-400" />
            </div>
          </motion.div>

          <h1 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
              Group Payments
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Simplify shared expenses with secure group payments on the blockchain
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex rounded-xl overflow-hidden bg-black/30 backdrop-blur-xl border border-green-500/20 p-1">
            {Object.values(PaymentTabs).map((tab) => (
              <motion.button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-green-500 text-black' 
                    : 'text-green-400 hover:bg-green-500/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === PaymentTabs.CREATE && (
              <motion.div
                key="create"
                initial="initial"
                animate="animate"
                exit="initial"
                variants={fadeIn}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* Create Form */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl" />
                  <div className="relative bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-green-500/20">
                    <form onSubmit={handleCreatePayment} className="space-y-6">
                      <div>
                        <label className="mb-2 text-green-400 font-medium">Recipient</label>
                        <input
                          type="text"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                          placeholder="0x... address"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2 text-green-400 font-medium">Amount per Person ({currentChain.symbol})</label>
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
                      </div>

                      <div>
                        <label className="mb-2 text-green-400 font-medium">Number of Participants</label>
                        <input
                          type="number"
                          value={participants}
                          onChange={(e) => setParticipants(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                          placeholder="2"
                          required
                          min="2"
                        />
                      </div>

                      <div>
                        <label className="mb-2 text-green-400 font-medium flex items-center space-x-2">
                          <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
                          <span>Remarks</span>
                        </label>
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                          placeholder="Add a note about this group payment"
                          required
                          rows={3}
                        />
                      </div>

                      <motion.button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:brightness-110 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isLoading || !signer}
                      >
                        {isLoading ? (
                          <>
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <ArrowRightIcon className="w-5 h-5" />
                            <span>Create Payment</span>
                          </>
                        )}
                      </motion.button>
                    </form>
                  </div>
                </div>

                {/* Recent Payments */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl" />
                  <div className="relative bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-green-500/20">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-green-400 flex items-center space-x-2">
                        <ClockIcon className="w-5 h-5" />
                        <span>Recent Payments</span>
                      </h2>
                      <motion.button
                        onClick={fetchGroupPayments}
                        className="bg-black/30 p-2 rounded-lg text-green-400 hover:text-green-300"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ArrowPathIcon className="w-5 h-5" />
                      </motion.button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 styled-scrollbar">
                      {isFetching ? (
                        <LoadingSpinner />
                      ) : myGroupPayments.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          No payments created yet
                        </div>
                      ) : (
                        myGroupPayments.map((payment) => (
                          <motion.div
                            key={payment.id}
                            className="relative group"
                            variants={fadeIn}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative bg-black/30 backdrop-blur-xl p-4 rounded-xl border border-green-500/10 group-hover:border-green-500/20">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="text-sm text-gray-400 mb-1">
                                    To: {truncateAddress(payment.recipient)}
                                  </div>
                                  <div className="text-green-400 font-semibold">
                                    {formatAmount(payment.amountPerPerson)} {currentChain.symbol} per person
                                  </div>
                                  
                                  {/* Payment ID with copy button */}
                                  <div className="flex items-center mt-2 text-xs text-gray-500">
                                    <span className="mr-1">ID:</span>
                                    <span className="font-mono">{truncateAddress(payment.id)}</span>
                                    <motion.button
                                      onClick={() => handleCopyId(payment.id)}
                                      className="ml-1 text-green-400 hover:text-green-300"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      title="Copy payment ID"
                                    >
                                      <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                                    </motion.button>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm ${
                                  payment.status === 0 
                                    ? 'bg-yellow-500/20 text-yellow-400' 
                                    : payment.status === 1
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {payment.status === 0 ? 'Pending' : payment.status === 1 ? 'Completed' : 'Cancelled'}
                                </span>
                              </div>
                              
                              {payment.remarks && (
                                <div className="bg-black/20 p-2 rounded-lg text-sm text-gray-400 mb-2">
                                  {payment.remarks}
                                </div>
                              )}

                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <div className="flex items-center space-x-2">
                                  <ClockIcon className="w-4 h-4" />
                                  <span>{new Date(payment.timestamp * 1000).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div>
                                    {payment.numParticipants} participants
                                  </div>
                                  
                                  {/* Add Contribute button */}
                                  {payment.status === 0 && Number(payment.amountCollected) < Number(payment.totalAmount) && (
                                    <motion.button
                                      onClick={() => {
                                        setPaymentId(payment.id);
                                        setAmount(payment.amountPerPerson);
                                        setActiveTab(PaymentTabs.CONTRIBUTE);
                                      }}
                                      className="ml-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs flex items-center"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <UserPlusIcon className="w-3 h-3 mr-1" />
                                      <span>Contribute</span>
                                    </motion.button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === PaymentTabs.CONTRIBUTE && (
              <motion.div
                key="contribute"
                initial="initial"
                animate="animate"
                exit="initial"
                variants={fadeIn}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Contribute Form */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl" />
                    <div className="relative bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-green-500/20">
                      <h2 className="text-xl font-semibold text-green-400 mb-6">Contribute to Payment</h2>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (paymentId && amount) handleContribute(paymentId, amount);
                      }} className="space-y-6">
                        <div>
                        <label className="mb-2 text-green-400 font-medium">Payment ID</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={paymentId}
                            onChange={handlePaymentIdChange}
                            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                            placeholder="Enter payment ID"
                            required
                          />
                        </div>
                      </div>

                        <div>
                          <label className="mb-2 text-green-400 font-medium">Amount ({currentChain.symbol})</label>
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
                        </div>

                        <motion.button
                          type="submit"
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:brightness-110 disabled:opacity-50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isLoading || !signer}
                        >
                          {isLoading ? (
                            <>
                              <ArrowPathIcon className="w-5 h-5 animate-spin" />
                              <span>Contributing...</span>
                            </>
                          ) : (
                            <>
                              <UserPlusIcon className="w-5 h-5" />
                              <span>Contribute</span>
                            </>
                          )}
                        </motion.button>
                      </form>
                    </div>
                  </div>

                  {/* Available Payments */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl" />
                    <div className="relative bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-green-500/20">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-green-400 flex items-center space-x-2">
                          <ClockIcon className="w-5 h-5" />
                          <span>Completed Payments</span>
                        </h2>
                        <motion.button
                          onClick={fetchGroupPayments}
                          className="bg-black/30 p-2 rounded-lg text-green-400 hover:text-green-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ArrowPathIcon className="w-5 h-5" />
                        </motion.button>
                      </div>

                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 styled-scrollbar">
                        {isFetching ? (
                          <LoadingSpinner />
                        ) : availablePayments.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            No available payments
                          </div>
                        ) : (
                          availablePayments.map((payment) => (
                            <motion.div
                              key={payment.id}
                              className="relative group"
                              variants={fadeIn}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="relative bg-black/30 backdrop-blur-xl p-4 rounded-xl border border-green-500/10 group-hover:border-green-500/20">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    {/* Payment ID with copy button */}
                                    <div className="text-sm text-gray-400 mb-1 flex items-center">
                                      <span>Payment ID:</span>
                                      <span className="font-mono ml-1">{truncateAddress(payment.id)}</span>
                                      <motion.button
                                        onClick={() => handleCopyId(payment.id)}
                                        className="ml-1 text-green-400 hover:text-green-300"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Copy payment ID"
                                      >
                                        <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                                      </motion.button>
                                    </div>
                                    <div className="text-green-400 font-semibold">
                                      {formatAmount(payment.amountPerPerson)} {currentChain.symbol} required
                                    </div>
                                  </div>
                                  {payment.status === 0 && (
                                    <motion.button
                                      onClick={() => handleContribute(payment.id, payment.amountPerPerson)}
                                      className="bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 border px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      disabled={isLoading}
                                    >
                                      <UserPlusIcon className="w-4 h-4" />
                                      <span>Contribute</span>
                                    </motion.button>
                                  )}
                                </div>

                                {payment.remarks && (
                                  <div className="bg-black/20 p-2 rounded-lg text-sm text-gray-400 mb-2">
                                    {payment.remarks}
                                  </div>
                                )}

                                <div className="text-xs text-gray-500 flex items-center space-x-2">
                                  <ClockIcon className="w-4 h-4" />
                                  <span>{new Date(payment.timestamp * 1000).toLocaleString()}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === PaymentTabs.MY_PAYMENTS && (
              <motion.div
                key="my-payments"
                initial="initial"
                animate="animate"
                exit="initial"
                variants={fadeIn}
                className="space-y-6"
              >
                {isFetching ? (
                  <LoadingSpinner />
                ) : myGroupPayments.length === 0 ? (
                  <div className="text-center bg-black/40 backdrop-blur-xl p-12 rounded-2xl border border-green-500/20">
                    <UsersIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No Payments Created</h3>
                    <p className="text-gray-500">You haven&apos;t created any group payments yet.</p>
                  </div>
                ) : (
                  myGroupPayments.map((payment) => (
                    <motion.div
                      key={payment.id}
                      className="relative group"
                      variants={fadeIn}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative bg-black/30 backdrop-blur-xl p-6 rounded-xl border border-green-500/10 group-hover:border-green-500/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold text-green-400 mb-2">Payment Details</h3>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-400">ID: {truncateAddress(payment.id)}</p>
                              <p className="text-gray-400">Recipient: {truncateAddress(payment.recipient)}</p>
                              <p className="text-gray-400">Amount per Person: {formatAmount(payment.amountPerPerson)} {currentChain.symbol}</p>
                              <p className="text-gray-400">Total Amount: {formatAmount(payment.totalAmount)} {currentChain.symbol}</p>
                            </div>
                            
                            {/* Payment ID with copy button */}
                            <div className="mt-4 p-3 rounded-xl bg-black/30 border border-green-500/20">
                              <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-400">Payment ID</div>
                                <motion.button
                                  onClick={() => handleCopyId(payment.id)}
                                  className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center space-x-1 px-2 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <span className="flex items-center space-x-1">
                                    <ClipboardDocumentIcon className="w-4 h-4" />
                                    <span>Copy ID</span>
                                  </span>
                                </motion.button>
                              </div>
                              <div className="mt-1 font-mono text-green-400 break-all text-xs">{payment.id}</div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-semibold text-green-400">Progress</h3>
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                payment.status === 0 
                                  ? 'bg-yellow-500/20 text-yellow-400' 
                                  : payment.status === 1
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                              }`}>
                                {payment.status === 0 ? 'Pending' : payment.status === 1 ? 'Completed' : 'Cancelled'}
                              </span>
                            </div>
                            <div className="h-2 bg-black/50 rounded-full overflow-hidden mb-2">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${(Number(payment.amountCollected) / Number(payment.totalAmount)) * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">
                                {Math.round((Number(payment.amountCollected) / Number(payment.totalAmount)) * 100)}% collected
                              </span>
                              <span className="text-gray-400">
                                {payment.numParticipants} participants
                              </span>
                            </div>
                            
                            {/* Add Contribute to Payment button */}
                            {payment.status === 0 && Number(payment.amountCollected) < Number(payment.totalAmount) && (
                              <motion.button
                                onClick={() => {
                                  setPaymentId(payment.id);
                                  setAmount(payment.amountPerPerson);
                                  setActiveTab(PaymentTabs.CONTRIBUTE);
                                }}
                                className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:brightness-110"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <UserPlusIcon className="w-5 h-5" />
                                <span>Contribute to Payment</span>
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-black/80 p-6 rounded-2xl border border-green-500/20 flex flex-col items-center space-y-4">
              <ArrowPathIcon className="w-8 h-8 text-green-400 animate-spin" />
              <p className="text-green-400 font-medium">Processing Transaction...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

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

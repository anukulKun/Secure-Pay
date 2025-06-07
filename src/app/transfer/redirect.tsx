'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function RedirectComponent() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new dashboard route
    router.replace('/dashboard/transfer')
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center">
        <ArrowPathIcon className="w-10 h-10 text-green-400 animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-medium mb-2">Redirecting...</h1>
        <p className="text-gray-400">Taking you to the new dashboard</p>
      </div>
    </div>
  )
}

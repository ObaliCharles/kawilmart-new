'use client'
import { assets } from '@/assets/assets'
import { useAppContext } from '@/context/AppContext'
import Image from 'next/image'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'

const POLL_INTERVAL_MS = 2500
const MAX_POLLS = 16 // ~40s before we stop waiting and hand off to My Orders

const OrderPlacedContent = () => {
  const { router, getToken, fetchUserData } = useAppContext()
  const searchParams = useSearchParams()

  // Our own reference, plus Pesapal's tracking id which it appends to the
  // callback URL when it sends the shopper back.
  const reference = searchParams.get('ref') || searchParams.get('OrderMerchantReference') || ''
  const trackingId = searchParams.get('OrderTrackingId') || ''

  const [status, setStatus] = useState(reference ? 'checking' : 'placed')
  const pollsRef = useRef(0)
  const timerRef = useRef(null)

  const checkStatus = useCallback(async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/order/payment-status', {
        params: { reference, trackingId },
        headers: { Authorization: `Bearer ${token}` },
      })

      if (data?.paymentStatus === 'paid') {
        setStatus('paid')
        void fetchUserData()
        return true
      }

      if (data?.paymentStatus === 'failed') {
        setStatus('failed')
        return true
      }
    } catch {
      // Keep waiting — a transient error here should not tell the shopper
      // their payment failed when it may well have succeeded.
    }

    return false
  }, [getToken, reference, trackingId, fetchUserData])

  useEffect(() => {
    if (!reference) {
      const timer = setTimeout(() => router.push('/my-orders'), 5000)
      return () => clearTimeout(timer)
    }

    let cancelled = false

    const poll = async () => {
      if (cancelled) return

      const settled = await checkStatus()
      if (cancelled || settled) return

      pollsRef.current += 1
      if (pollsRef.current >= MAX_POLLS) {
        setStatus('slow')
        return
      }

      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
    }

    void poll()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [reference, checkStatus, router])

  const view = {
    placed: {
      title: 'Order Placed Successfully',
      body: '',
      spinner: true,
    },
    checking: {
      title: 'Confirming Your Payment',
      body: 'We are checking with your mobile money provider. This usually takes a few seconds — please do not close this page.',
      spinner: true,
    },
    paid: {
      title: 'Payment Confirmed',
      body: 'Your payment went through and your order is on its way to the seller.',
      spinner: false,
    },
    failed: {
      title: 'Payment Not Completed',
      body: 'We could not confirm your payment, so the order was not placed and you have not been charged. Your items are still in your cart.',
      spinner: false,
    },
    slow: {
      title: 'Still Confirming',
      body: 'Your payment is taking longer than usual to confirm. It will update automatically — you can check the status on your orders page.',
      spinner: false,
    },
  }[status]

  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-5 px-6'>
      <div className='relative flex items-center justify-center'>
        {status === 'failed' ? (
          <div className='flex h-24 w-24 items-center justify-center rounded-full bg-red-50'>
            <svg className='h-10 w-10 text-red-500' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
              <path d='m7 7 10 10M17 7 7 17' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
            </svg>
          </div>
        ) : (
          <>
            <Image className='absolute p-5' src={assets.checkmark} alt='' />
            <div
              className={`h-24 w-24 rounded-full border-4 border-gray-200 ${
                view.spinner ? 'animate-spin border-t-green-300' : 'border-t-green-500'
              }`}
            />
          </>
        )}
      </div>

      <div className='text-center text-2xl font-semibold'>{view.title}</div>
      {view.body ? (
        <p className='max-w-md text-center text-sm leading-6 text-gray-500'>{view.body}</p>
      ) : null}

      <div className='flex flex-wrap justify-center gap-2.5'>
        <button
          type='button'
          onClick={() => router.push('/my-orders')}
          className='rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700'
        >
          View my orders
        </button>
        {status === 'failed' ? (
          <button
            type='button'
            onClick={() => router.push('/cart')}
            className='rounded-full bg-gray-100 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200'
          >
            Back to cart
          </button>
        ) : null}
      </div>
    </div>
  )
}

const OrderPlaced = () => (
  <Suspense fallback={<div className='min-h-screen' />}>
    <OrderPlacedContent />
  </Suspense>
)

export default OrderPlaced

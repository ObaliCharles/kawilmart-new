'use client'
import { assets } from '@/assets/assets'
import { useAppContext } from '@/context/AppContext'
import Image from 'next/image'
import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const OrderPlacedContent = () => {

  const { router } = useAppContext()
  const searchParams = useSearchParams()
  // Present only when the shopper is coming back from a gateway checkout page.
  const paymentReference = searchParams.get('ref')

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/my-orders')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className='h-screen flex flex-col justify-center items-center gap-5 px-6'>
      <div className="flex justify-center items-center relative">
        <Image className="absolute p-5" src={assets.checkmark} alt='' />
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-t-green-300 border-gray-200"></div>
      </div>
      <div className="text-center text-2xl font-semibold">
        {paymentReference ? 'Confirming Your Payment' : 'Order Placed Successfully'}
      </div>
      {paymentReference ? (
        // The gateway webhook is what actually confirms the order, and it can
        // land a moment after the shopper is redirected back. Point them at the
        // orders page rather than claiming success we have not verified.
        <p className="max-w-md text-center text-sm text-gray-500">
          Your payment is being confirmed with your mobile money provider. This usually takes a few
          seconds &mdash; your orders page will show the payment as Paid once it clears.
        </p>
      ) : null}
    </div>
  )
}

const OrderPlaced = () => (
  <Suspense fallback={<div className='h-screen' />}>
    <OrderPlacedContent />
  </Suspense>
)

export default OrderPlaced

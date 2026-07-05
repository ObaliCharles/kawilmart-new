import React from 'react'
import Skeleton from '@/components/Skeleton'

export const ProductsGridSkeleton = ({ showHeader = true, cardCount = 10 }) => {
  return (
    <div className="space-y-6" aria-hidden="true">
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 rounded-xl" />
          <Skeleton className="h-4 w-48 rounded-full" />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
            <Skeleton className="h-3 w-3/5 rounded-full" />
            <Skeleton className="h-3 w-2/5 rounded-full" />
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const AllProductsPageSkeleton = () => {
  return (
    <div className="px-6 md:px-16 lg:px-32 py-8 min-h-screen bg-gray-50/30" aria-hidden="true">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="h-4 w-48 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg md:hidden" />
        </div>
      </div>

      <div className="flex gap-8">
        <div className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-6 bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>

        <div className="flex-1">
          <ProductsGridSkeleton showHeader={false} />
        </div>
      </div>
    </div>
  )
}

export const ProductDetailSkeleton = () => {
  return (
    <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10" aria-hidden="true">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div className="px-5 lg:px-16 xl:px-20 space-y-4">
          <Skeleton className="h-[420px] w-full rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-9 w-5/6 rounded-xl" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
            <Skeleton className="h-11 w-24 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-11/12 rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded-full" />
          </div>

          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-px w-full rounded-full" />

          <div className="space-y-3 max-w-72">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full rounded-full" />
            ))}
          </div>

          <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-100">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-5/6 rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-16">
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-1 w-28 rounded-full" />
        </div>
        <ProductsGridSkeleton showHeader={false} cardCount={5} />
        <div className="flex justify-center">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export const ContentPageSkeleton = () => {
  return (
    <div className="min-h-[60vh] px-6 md:px-16 lg:px-32 py-10" aria-hidden="true">
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-10 w-3/4 rounded-2xl" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-11/12 rounded-full" />
        <Skeleton className="h-4 w-5/6 rounded-full" />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-10">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <Skeleton className="h-8 w-24 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const OrdersPageSkeleton = ({ titleWidth = 'w-36', rowCount = 4 }) => {
  return (
    <div className="flex flex-col justify-between px-6 md:px-16 lg:px-32 py-6 min-h-screen" aria-hidden="true">
      <div className="space-y-5">
        <Skeleton className={`mt-6 h-7 ${titleWidth} rounded-xl`} />

        <div className="max-w-5xl border-t border-gray-200">
          {Array.from({ length: rowCount }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[1.5fr_1.1fr_0.7fr_0.9fr] gap-5 p-5 border-b border-gray-200"
            >
              <div className="flex gap-5 max-w-80">
                <Skeleton className="h-16 w-16 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-full rounded-full" />
                  <Skeleton className="h-4 w-32 rounded-full" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-4 w-40 rounded-full max-w-full" />
                <Skeleton className="h-4 w-36 rounded-full max-w-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>

              <div className="flex items-center">
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const NotificationsPageSkeleton = () => {
  return (
    <div className="min-h-screen px-6 md:px-16 lg:px-32 py-8" aria-hidden="true">
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-52 rounded-full max-w-full" />
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-5/6 rounded-full" />
                  <Skeleton className="h-3 w-40 rounded-full" />
                </div>
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

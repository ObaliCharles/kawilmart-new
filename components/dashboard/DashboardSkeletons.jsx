import React from 'react'
import Skeleton from '@/components/Skeleton'

export const NavbarUserSkeleton = ({ showName = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      {showName && <Skeleton className="hidden md:block h-4 w-28 rounded-full" />}
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  )
}

export const ProductGridPageSkeleton = () => {
  return (
    <div className="space-y-6 max-w-7xl" aria-hidden="true">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36 rounded-xl max-w-full" />
          <Skeleton className="h-4 w-40 rounded-full max-w-full" />
        </div>
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-56 rounded-lg max-w-full" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="h-40 bg-gray-50 p-4">
              <Skeleton className="h-full w-full rounded-xl" />
            </div>
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-4/5 rounded-full" />
              <Skeleton className="h-3 w-2/5 rounded-full" />
              <Skeleton className="h-4 w-1/2 rounded-full" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const ProductTablePageSkeleton = () => {
  return (
    <div className="w-full md:p-10 p-4" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32 rounded-xl" />
        <Skeleton className="h-4 w-48 rounded-full" />
      </div>

      <div className="mt-4 flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-200">
        <div className="w-full p-4 space-y-4">
          <div className="hidden sm:grid sm:grid-cols-[2.6fr_1fr_1fr_1.6fr] gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 rounded-full" />
            ))}
          </div>

          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-[2.6fr_1fr_1fr_1.6fr] gap-4 items-center border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <Skeleton className="h-4 flex-1 rounded-full max-w-[200px]" />
              </div>
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-9 w-16 rounded-md" />
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const DashboardShellSkeleton = ({ showSidebar = true }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" aria-hidden="true">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showSidebar && <Skeleton className="md:hidden h-10 w-10 rounded-lg" />}
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="hidden md:block h-6 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="hidden md:block h-4 w-24 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </header>

      <div className="flex flex-1">
        {showSidebar && (
          <aside className="hidden md:flex w-60 flex-col bg-white border-r border-gray-200 px-3 py-4 gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-11 rounded-xl" />
            ))}
            <div className="mt-auto border-t border-gray-100 pt-4 space-y-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </aside>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="space-y-6 max-w-7xl">
            <div className="space-y-2">
              <Skeleton className="h-8 w-56 rounded-xl max-w-full" />
              <Skeleton className="h-4 w-80 rounded-full max-w-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-2xl" />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Skeleton className="xl:col-span-2 h-72 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export const AdminUsersPageSkeleton = () => {
  return (
    <div className="space-y-6 max-w-7xl" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-xl max-w-full" />
        <Skeleton className="h-4 w-72 rounded-full max-w-full" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-8 w-14 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-64 rounded-lg max-w-full" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 md:p-5 space-y-4">
        <div className="hidden md:grid md:grid-cols-[2.4fr_1.7fr_1fr_1.2fr_1.1fr] gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-4 rounded-full" />
          ))}
        </div>

        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-[2.4fr_1.7fr_1fr_1.2fr_1.1fr] gap-4 items-center border-t border-gray-100 pt-4 first:border-t-0 first:pt-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32 rounded-full max-w-full" />
                <Skeleton className="h-3 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const AdminManagementPageSkeleton = () => {
  return (
    <div className="w-full md:p-10 p-4 space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-full max-w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32 rounded-full max-w-full" />
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>

            <div className="space-y-2">
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <Skeleton key={rowIndex} className="h-4 w-full rounded-full" />
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="h-9 flex-1 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const OrdersManagementPageSkeleton = ({ showTabs = false, rowCount = 6 }) => {
  return (
    <div className="space-y-6 max-w-7xl" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 rounded-xl max-w-full" />
        <Skeleton className="h-4 w-28 rounded-full" />
      </div>

      {showTabs && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-28 rounded-full" />
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[1fr_1.4fr_1.1fr_0.8fr_0.8fr_1fr_1fr] gap-4 px-5 py-4 border-b border-gray-100">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-4 rounded-full" />
          ))}
        </div>

        {Array.from({ length: rowCount }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_1.1fr_0.8fr_0.8fr_1fr_1fr] gap-4 px-5 py-4 border-t border-gray-50 first:border-t-0"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-5/6 rounded-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-4 w-40 rounded-full max-w-full" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>

            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const RiderDashboardSkeleton = () => {
  return (
    <div className="px-4 md:px-10 lg:px-20 py-8 min-h-screen bg-gray-50" aria-hidden="true">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-56 rounded-xl max-w-full" />
          <Skeleton className="h-4 w-48 rounded-full max-w-full" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl p-4 border border-white shadow-sm bg-white space-y-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full max-w-full" />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <Skeleton className="h-11 w-32 rounded-xl" />
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 rounded-full max-w-full" />
                  <Skeleton className="h-3 w-28 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((__, stepIndex) => (
                <div key={stepIndex} className="space-y-2 flex flex-col items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-12 rounded-full" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded-full" />
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((__, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-28 rounded-full" />
                        <Skeleton className="h-3 w-16 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-4 w-24 rounded-full" />
                <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-4 w-40 rounded-full max-w-full" />
                  <Skeleton className="h-4 w-36 rounded-full max-w-full" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const AdminDashboardPageSkeleton = () => {
  return (
    <div className="space-y-8 max-w-7xl" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52 rounded-xl max-w-full" />
        <Skeleton className="h-4 w-80 rounded-full max-w-full" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-3 w-28 rounded-full max-w-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
          <Skeleton className="h-5 w-44 rounded-full" />
          <div className="flex items-end gap-3 h-40">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton className="h-3 w-10 rounded-full" />
                <Skeleton className={`w-full rounded-t-lg ${index % 2 === 0 ? 'h-24' : 'h-16'}`} />
                <Skeleton className="h-3 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <Skeleton className="h-5 w-32 rounded-full" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <Skeleton className="h-7 w-28 rounded-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-20 rounded-full" />
                <Skeleton className="h-4 w-6 rounded-full" />
              </div>
            </div>
          ))}

          <Skeleton className="mt-4 h-5 w-36 rounded-full" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 rounded-full" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((__, cellIndex) => (
                <Skeleton key={cellIndex} className="h-4 rounded-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const AnalyticsPageSkeleton = () => {
  return (
    <div className="space-y-8 max-w-7xl" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <Skeleton className="h-4 w-56 rounded-full max-w-full" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-full max-w-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
            <Skeleton className="h-5 w-44 rounded-full max-w-full" />
            <Skeleton className="h-4 w-28 rounded-full" />

            {index === 0 ? (
              <div className="flex items-end gap-2 h-48">
                {Array.from({ length: 7 }).map((__, barIndex) => (
                  <div key={barIndex} className="flex-1 flex flex-col items-center gap-2">
                    <Skeleton className="h-3 w-10 rounded-full" />
                    <Skeleton className={`w-full rounded-lg ${barIndex % 2 === 0 ? 'h-28' : 'h-16'}`} />
                    <Skeleton className="h-3 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((__, rowIndex) => (
                  <div key={rowIndex} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24 rounded-full" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export const PromotionsPageSkeleton = () => {
  return (
    <div className="space-y-8 max-w-7xl" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 rounded-xl max-w-full" />
        <Skeleton className="h-4 w-72 rounded-full max-w-full" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <Skeleton className="h-6 w-40 rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-5 w-4/5 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <Skeleton className="h-11 w-32 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const SellerProductFormSkeleton = () => {
  return (
    <div className="md:p-10 p-4 space-y-5 max-w-lg" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52 rounded-xl max-w-full" />
        <Skeleton className="h-4 w-72 rounded-full max-w-full" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-28 rounded-full" />
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-24 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>

      <Skeleton className="h-11 w-36 rounded-xl" />
    </div>
  )
}

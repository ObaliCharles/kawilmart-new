'use client'

import React from 'react'
import { useAppContext } from '@/context/AppContext'

// A slim top progress bar is the whole route-change indicator now. The old
// full-screen blur+dim overlay that used to sit under this made every
// navigation feel heavy and, when the loading flag got stuck, left the page
// unusable until a refresh. The bar is non-blocking: the page stays fully
// interactive underneath while it animates.
const RouteLoader = () => {
  const { isRouteLoading } = useAppContext()

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] transition-opacity duration-150 ${
        isRouteLoading ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="relative h-[3px] w-full overflow-hidden bg-orange-100/90">
        <div
          className={`route-progress-bar absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 ${
            isRouteLoading ? 'is-active' : 'is-complete'
          }`}
        />
      </div>
    </div>
  )
}

export default RouteLoader

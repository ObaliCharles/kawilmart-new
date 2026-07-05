'use client'

import React from 'react'
import { useAppContext } from '@/context/AppContext'

const RouteLoader = () => {
  const { isRouteLoading } = useAppContext()

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] transition-opacity duration-200 ${
        isRouteLoading ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="h-1.5 w-full bg-orange-100">
        <div className="h-full w-1/3 bg-orange-500 rounded-r-full" />
      </div>
      <div className="h-10 bg-gradient-to-b from-orange-50/70 to-transparent" />
    </div>
  )
}

export default RouteLoader

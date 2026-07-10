'use client'

import React, { useEffect, useState } from 'react'
import { useAppContext } from '@/context/AppContext'

const RouteLoader = () => {
  const { isRouteLoading } = useAppContext()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isRouteLoading) {
      setVisible(true)
      return undefined
    }

    const timer = window.setTimeout(() => setVisible(false), 80)
    return () => window.clearTimeout(timer)
  }, [isRouteLoading])

  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-x-0 top-0 z-[100] transition-opacity duration-75 ${
          visible ? 'opacity-100' : 'opacity-0'
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
      {visible ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[90] bg-[#f8fafc]/40 backdrop-blur-[1px]"
        />
      ) : null}
    </>
  )
}

export default RouteLoader

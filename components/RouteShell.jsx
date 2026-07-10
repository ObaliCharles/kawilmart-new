'use client'

import { useAppContext } from '@/context/AppContext'
import { useEffect, useState } from 'react'

const RouteShell = ({ children }) => {
  const { isRouteLoading } = useAppContext()
  const [contentVisible, setContentVisible] = useState(true)

  useEffect(() => {
    if (isRouteLoading) {
      setContentVisible(false)
    } else {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setContentVisible(true), 30)
      return () => clearTimeout(timer)
    }
  }, [isRouteLoading])

  return (
    <div className={`min-h-screen bg-[#f8fafc] transition-opacity duration-100 ${isRouteLoading ? 'route-shell-loading' : ''}`}>
      <div className={`transition-opacity duration-150 ${contentVisible ? 'opacity-100' : 'opacity-50'}`}>
        {children}
      </div>
    </div>
  )
}

export default RouteShell
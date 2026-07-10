'use client'

import { useAppContext } from '@/context/AppContext'

const RouteShell = ({ children }) => {
  const { isRouteLoading } = useAppContext()

  return (
    <div className={`min-h-screen bg-[#f8fafc] transition-colors duration-75 ${isRouteLoading ? 'route-shell-loading' : ''}`}>
      {children}
    </div>
  )
}

export default RouteShell

'use client'
import Navbar from '@/components/seller/Navbar'
import Sidebar from '@/components/seller/Sidebar'
import React from 'react'
import { useAppContext } from '@/context/AppContext'

const Layout = ({ children }) => {
  const { authReady, accessLoaded, loadingUser, isSeller } = useAppContext()
  const accessReady = authReady && accessLoaded && !loadingUser

  if (!accessReady) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  if (!isSeller) {
    return children
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className='flex w-full flex-col md:flex-row'>
        <Sidebar />
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout

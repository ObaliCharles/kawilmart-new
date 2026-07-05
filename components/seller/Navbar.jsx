'use client'

import React, { startTransition } from 'react'
import Link from 'next/link'
import { assets } from '../../assets/assets'
import Image from 'next/image'
import { useAppContext } from '@/context/AppContext'
import { UserButton, useClerk, useUser } from '@clerk/nextjs'
import { NavbarUserSkeleton } from '@/components/dashboard/DashboardSkeletons'

const sellerUserButtonAppearance = {
  elements: {
    avatarBox: 'h-10 w-10 rounded-full ring-2 ring-orange-200 shadow-sm overflow-hidden',
    userButtonTrigger: 'focus:shadow-none',
  },
}

const Navbar = () => {

  const { router } = useAppContext()
  const { signOut } = useClerk()
  const { isLoaded } = useUser()

  const handleLogout = async () => {
    await signOut()
    startTransition(() => {
      router.push('/')
    })
  }

  return (
    <div className='flex items-center justify-between border-b px-4 py-3 md:px-8'>
      <Link href="/">
        <Image className='w-28 lg:w-32 cursor-pointer' src={assets.logo} alt="" />
      </Link>
      <div className='flex items-center gap-2 sm:gap-3'>
        {isLoaded ? (
          <UserButton userProfileMode="modal" appearance={sellerUserButtonAppearance} />
        ) : (
          <NavbarUserSkeleton />
        )}
        <button onClick={handleLogout} className='rounded-full bg-gray-600 px-4 py-2 text-[11px] text-white sm:px-7 sm:py-2 sm:text-sm'>Logout</button>
      </div>
    </div>
  )
}

export default Navbar

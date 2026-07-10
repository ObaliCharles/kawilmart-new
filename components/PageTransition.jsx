'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const PageTransition = ({ children }) => {
  const pathname = usePathname()
  const isFirstRender = useRef(true)
  const [phase, setPhase] = useState('idle')

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    setPhase('entering')

    const timer = window.setTimeout(() => {
      setPhase('idle')
    }, 200)

    return () => window.clearTimeout(timer)
  }, [pathname])

  return (
    <div className={phase === 'entering' ? 'page-enter' : undefined}>
      {children}
    </div>
  )
}

export default PageTransition

'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Skeleton from './Skeleton'

const ClerkAvatarImage = ({
  src,
  alt,
  fallback = '?',
  className = 'h-10 w-10',
  fallbackClassName = '',
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(!src)

  useEffect(() => {
    setIsLoaded(false)
    setHasError(!src)
  }, [src])

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold ${className} ${fallbackClassName}`}
      >
        {fallback}
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-full ${className}`}>
      {!isLoaded && <Skeleton className="absolute inset-0 rounded-full" />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="64px"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true)
          setIsLoaded(true)
        }}
        className={`h-full w-full object-cover transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}

export default ClerkAvatarImage

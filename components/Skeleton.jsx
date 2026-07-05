import React from 'react'

const Skeleton = ({ className = '', animated = true }) => {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-[#e6e6e6] ${animated ? 'skeleton-shimmer' : ''} ${className}`}
    />
  )
}

export default Skeleton

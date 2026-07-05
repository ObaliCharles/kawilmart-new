import React from 'react'
import Skeleton from './Skeleton'

const Loading = ({ message = "Items refreshing..." }) => {
    return (
        <div className="w-full min-h-[55vh] flex items-center justify-center px-6" aria-hidden="true">
            <div className="w-full max-w-5xl space-y-6">
                <div className="space-y-3">
                    <Skeleton className="h-8 w-52 rounded-xl" />
                    <Skeleton className="h-4 w-72 rounded-full max-w-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                            <Skeleton className="h-40 w-full rounded-xl" />
                            <Skeleton className="h-5 w-3/4 rounded-full" />
                            <Skeleton className="h-4 w-full rounded-full" />
                            <Skeleton className="h-4 w-2/3 rounded-full" />
                        </div>
                    ))}
                </div>
                <p className="sr-only">{message}</p>
            </div>
        </div>
    )
}

export default Loading

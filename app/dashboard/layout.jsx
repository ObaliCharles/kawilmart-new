'use client'
import React from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import { DashboardShellSkeleton } from '@/components/dashboard/DashboardSkeletons';

const RiderLayout = ({ children }) => {
  const { authReady, accessLoaded, loadingUser, isRider, resolvedRole, refreshAccessState } = useAppContext();
  const accessReady = authReady && accessLoaded && !loadingUser;

  if (!accessReady) {
    return <DashboardShellSkeleton showSidebar={false} />;
  }

  if (!isRider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🛵</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Rider Access Required</h1>
          <p className="text-gray-600 mb-6">
            Your current role is <strong>{resolvedRole || 'buyer'}</strong>.
            You need a rider or admin role to use the rider dashboard.
          </p>
          <button
            onClick={async () => {
              const data = await refreshAccessState();
              if (data.success) {
                toast.success(data.message);
              } else {
                toast.error(data.message || 'Failed to refresh access');
              }
            }}
            className="w-full mb-3 bg-orange-600 text-white py-3 px-5 rounded-lg hover:bg-orange-700 transition font-medium"
          >
            Refresh Access
          </button>
          <Link href="/" className="inline-flex bg-orange-600 text-white py-3 px-5 rounded-lg hover:bg-orange-700 transition font-medium">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

export default RiderLayout;

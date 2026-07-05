'use client'

import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AnalyticsPageSkeleton } from '@/components/dashboard/DashboardSkeletons';

export default function AdminAnalyticsPage() {
    const { getToken, user, authReady, formatCurrency, formatCompactCurrency } = useAppContext();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authReady && user) {
            void fetchStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, user]);

    const fetchStats = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                setStats(data.stats);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <AnalyticsPageSkeleton />;
    if (!stats) return <div className="py-20 text-center text-gray-400">No data available</div>;

    const maxRevenue = Math.max(...stats.revenueByDay.map((day) => day.revenue), 1);
    const totalCategoryProducts = Object.values(stats.categoryBreakdown).reduce((left, right) => left + right, 0);

    return (
        <div className="max-w-7xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="mt-1 text-sm text-gray-500">Platform performance overview</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                    { label: 'Avg Order Value', value: formatCurrency(stats.completedOrders ? stats.totalRevenue / stats.completedOrders : 0), icon: '💡' },
                    { label: 'Completion Rate', value: `${stats.totalOrders ? Math.round(((stats.completedOrders || 0) / stats.totalOrders) * 100) : 0}%`, icon: '✅' },
                    { label: 'Cancellation Rate', value: `${stats.totalOrders ? Math.round(((stats.cancelledOrders || 0) / stats.totalOrders) * 100) : 0}%`, icon: '❌' },
                    { label: 'Products/User Ratio', value: (stats.totalUsers ? (stats.totalProducts / stats.totalUsers).toFixed(1) : 0), icon: '📐' },
                ].map((kpi) => (
                    <div key={kpi.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="mb-1 text-2xl">{kpi.icon}</p>
                        <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{kpi.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-2 font-semibold text-gray-900">Daily Revenue (Last 7 Days)</h2>
                    <p className="mb-6 text-sm text-gray-400">Total: {formatCurrency(stats.totalRevenue)}</p>
                    <div className="flex h-48 items-end gap-2">
                        {stats.revenueByDay.map((day, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center gap-1">
                                <span className="text-xs text-gray-500">
                                    {day.revenue > 0 ? formatCompactCurrency(day.revenue) : ''}
                                </span>
                                <div className="h-[130px] w-full rounded-lg bg-gray-100">
                                    <div
                                        className="w-full rounded-lg bg-gradient-to-t from-orange-600 to-orange-300 transition-all duration-700"
                                        style={{ height: `${Math.max(3, (day.revenue / maxRevenue) * 100)}%`, marginTop: `${100 - Math.max(3, (day.revenue / maxRevenue) * 100)}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400">{day.day}</span>
                                <span className="text-xs text-gray-300">{day.count} orders</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-6 font-semibold text-gray-900">Products by Category</h2>
                    <div className="space-y-3">
                        {Object.entries(stats.categoryBreakdown)
                            .sort((left, right) => right[1] - left[1])
                            .map(([category, count]) => (
                                <div key={category}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-700">{category}</span>
                                        <span className="text-gray-500">{count} products ({Math.round((count / totalCategoryProducts) * 100)}%)</span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                                            style={{ width: `${(count / totalCategoryProducts) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-6 font-semibold text-gray-900">Order Status Distribution</h2>
                    <div className="space-y-3">
                        {Object.entries(stats.statusCounts).map(([status, count]) => {
                            const percentage = Math.round((count / stats.totalOrders) * 100);
                            return (
                                <div key={status}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-gray-700">{status}</span>
                                        <span className="text-gray-500">{count} ({percentage}%)</span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 font-semibold text-gray-900">Platform Summary</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: '💰', bg: 'bg-green-50' },
                            { label: 'Total Orders', value: stats.totalOrders, icon: '📦', bg: 'bg-blue-50' },
                            { label: 'Total Products', value: stats.totalProducts, icon: '🛍️', bg: 'bg-purple-50' },
                            { label: 'Total Users', value: stats.totalUsers, icon: '👥', bg: 'bg-orange-50' },
                        ].map((item) => (
                            <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
                                <span className="text-2xl">{item.icon}</span>
                                <p className={`mt-1 font-bold leading-tight text-gray-900 ${item.label === 'Total Revenue' ? 'break-words text-[15px] sm:text-2xl' : 'text-xl sm:text-2xl'}`}>{item.value}</p>
                                <p className="text-xs text-gray-500">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

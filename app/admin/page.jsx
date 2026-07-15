'use client'
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AdminDashboardPageSkeleton } from '@/components/dashboard/DashboardSkeletons';
import { getOrderStatusBadgeClass, getOrderStatusDisplay } from '@/lib/orderUi';

const StatCard = ({ icon, label, value, sub, color }) => (
    <div className="rounded-xl bg-white p-3.5 ring-1 ring-gray-100 transition hover:shadow-sm">
        <div className="flex items-start gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${color}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-gray-500">{label}</p>
                <p className="mt-0.5 truncate text-lg font-bold text-gray-950">{value}</p>
                {sub && <p className="mt-0.5 truncate text-[11px] text-gray-400">{sub}</p>}
            </div>
        </div>
    </div>
);

const ChartBar = ({ height, label, value, max }) => (
    <div className="flex flex-1 flex-col items-center gap-1.5">
        <span className="text-[10px] font-medium text-gray-500">{value}</span>
        <div className="flex w-full items-end justify-center" style={{ height: '120px' }}>
            <div
                className="w-full max-w-[2rem] rounded-t-lg bg-gradient-to-t from-orange-600 to-orange-400 transition-all duration-500 hover:from-orange-500 hover:to-orange-300"
                style={{ height: `${Math.max(6, (height / max) * 100)}%` }}
            />
        </div>
        <span className="text-[10px] text-gray-400">{label}</span>
    </div>
);

export default function AdminDashboard() {
    const { getToken, user, authReady, formatCurrency, formatCompactCurrency } = useAppContext();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authReady && user) fetchStats();
    }, [authReady, user]);

    const fetchStats = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) setStats(data.stats);
            else toast.error(data.message);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <AdminDashboardPageSkeleton />;
    if (!stats) return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <span className="text-5xl mb-4">🔒</span>
            <p className="text-xl font-semibold">Admin Access Required</p>
            <p className="text-sm mt-2">Your account needs the admin role to view this page.</p>
        </div>
    );

    const maxRevenue = Math.max(...stats.revenueByDay.map(d => d.revenue), 1);

    return (
        <div className="max-w-7xl space-y-4">
            {/* Page header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-gray-950">Dashboard</h1>
                    <p className="mt-0.5 text-xs text-gray-500">Welcome back, {user?.firstName}. Here's what's happening today.</p>
                </div>
                <button onClick={fetchStats} className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-200">
                    Refresh
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                <StatCard icon="💰" label="Total Revenue" value={formatCurrency(stats.totalRevenue)} sub={`${stats.completedOrders || 0} completed orders`} color="bg-green-50 text-green-600" />
                <StatCard icon="📦" label="Total Orders" value={stats.totalOrders.toLocaleString()} sub={`${stats.flaggedSellers || 0} flagged sellers`} color="bg-blue-50 text-blue-600" />
                <StatCard icon="🛍️" label="Products" value={stats.totalProducts.toLocaleString()} sub="Listed in store" color="bg-purple-50 text-purple-600" />
                <StatCard icon="👥" label="Users" value={stats.totalUsers.toLocaleString()} sub="Registered accounts" color="bg-orange-50 text-orange-600" />
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {/* Revenue Chart */}
                <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100 lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold text-gray-950">Revenue (Last 7 Days)</h2>
                    </div>
                    <div className="flex items-end gap-1.5 sm:gap-2">
                        {stats.revenueByDay.map((day, i) => (
                            <ChartBar key={i} height={day.revenue} label={day.day} value={formatCompactCurrency(day.revenue)} max={maxRevenue} />
                        ))}
                    </div>
                </div>

                {/* Order Status Breakdown */}
                <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                    <h2 className="mb-3 text-sm font-semibold text-gray-950">Order Status</h2>
                    <div className="space-y-3">
                        {Object.entries(stats.statusCounts).map(([status, count]) => (
                            <div key={status}>
                                <div className="mb-1 flex items-center justify-between gap-2">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getOrderStatusBadgeClass(status)}`}>
                                        {getOrderStatusDisplay(status)}
                                    </span>
                                    <span className="text-xs font-bold text-gray-700">{count}</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${(count / stats.totalOrders) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <h2 className="mb-3 text-sm font-semibold text-gray-950">Products by Category</h2>
                        <div className="space-y-2">
                            {Object.entries(stats.categoryBreakdown).slice(0, 5).map(([cat, count]) => (
                                <div key={cat} className="flex items-center justify-between gap-2">
                                    <span className="min-w-0 truncate text-xs text-gray-600">{cat}</span>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 sm:w-20">
                                            <div className="h-full rounded-full bg-orange-500" style={{ width: `${(count / stats.totalProducts) * 100}%` }} />
                                        </div>
                                        <span className="w-7 text-right text-xs font-semibold text-gray-800">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-100">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-gray-950">Recent Orders</h2>
                    <a href="/admin/orders" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                        View all →
                    </a>
                </div>

                {/* Mobile: compact list */}
                <div className="divide-y divide-gray-50 sm:hidden">
                    {stats.recentOrders.map((order, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                            <div className="min-w-0">
                                <p className="font-mono text-[11px] text-gray-500">#{String(order._id).slice(-8).toUpperCase()}</p>
                                <p className="mt-0.5 text-[11px] text-gray-400">{new Date(order.date).toLocaleDateString()}</p>
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-xs font-semibold text-gray-950">{formatCurrency(order.amount)}</p>
                                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${getOrderStatusBadgeClass(order.status)}`}>
                                    {getOrderStatusDisplay(order.status)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Order ID</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Amount</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats.recentOrders.map((order, i) => (
                                <tr key={i} className="transition hover:bg-gray-50/50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                                        #{String(order._id).slice(-8).toUpperCase()}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-800">
                                        {formatCurrency(order.amount)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getOrderStatusBadgeClass(order.status)}`}>
                                            {getOrderStatusDisplay(order.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-gray-500">
                                        {new Date(order.date).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
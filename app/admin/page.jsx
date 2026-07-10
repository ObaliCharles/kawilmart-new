'use client'
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AdminDashboardPageSkeleton } from '@/components/dashboard/DashboardSkeletons';
import { getOrderStatusBadgeClass, getOrderStatusDisplay } from '@/lib/orderUi';

const StatCard = ({ icon, label, value, sub, color }) => (
    <div className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-gray-200">
        <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm ring-1 ring-black/5 ${color}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
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
        <div className="space-y-8 max-w-7xl">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.firstName}. Here's what's happening today.</p>
                </div>
                <button onClick={fetchStats} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4 12a8 8 0 1 1 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M4 12h4M4 12V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="💰" label="Total Revenue" value={formatCurrency(stats.totalRevenue)} sub={`${stats.completedOrders || 0} completed orders`} color="bg-green-50 text-green-600" />
                <StatCard icon="📦" label="Total Orders" value={stats.totalOrders.toLocaleString()} sub={`${stats.flaggedSellers || 0} flagged sellers`} color="bg-blue-50 text-blue-600" />
                <StatCard icon="🛍️" label="Products" value={stats.totalProducts.toLocaleString()} sub="Listed in store" color="bg-purple-50 text-purple-600" />
                <StatCard icon="👥" label="Users" value={stats.totalUsers.toLocaleString()} sub="Registered accounts" color="bg-orange-50 text-orange-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900">Revenue (Last 7 Days)</h2>
                        <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700">+12.5% vs last week</span>
                    </div>
                    <div className="flex items-end gap-2">
                        {stats.revenueByDay.map((day, i) => (
                            <ChartBar key={i} height={day.revenue} label={day.day} value={formatCompactCurrency(day.revenue)} max={maxRevenue} />
                        ))}
                    </div>
                </div>

                {/* Order Status Breakdown */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 font-bold text-gray-900">Order Status</h2>
                    <div className="space-y-4">
                        {Object.entries(stats.statusCounts).map(([status, count]) => (
                            <div key={status}>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getOrderStatusBadgeClass(status)}`}>
                                        {getOrderStatusDisplay(status)}
                                    </span>
                                    <span className="text-sm font-bold text-gray-700">{count}</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all" style={{ width: `${(count / stats.totalOrders) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 border-t border-gray-100 pt-5">
                        <h2 className="mb-4 font-bold text-gray-900">Products by Category</h2>
                        <div className="space-y-2.5">
                            {Object.entries(stats.categoryBreakdown).slice(0, 5).map(([cat, count]) => (
                                <div key={cat} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">{cat}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden">
                                            <div className="h-full rounded-full bg-orange-500" style={{ width: `${(count / stats.totalProducts) * 100}%` }} />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800 w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 className="font-bold text-gray-900">Recent Orders</h2>
                    <a href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700">
                        View all
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order ID</th>
                                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats.recentOrders.map((order, i) => (
                                <tr key={i} className="transition hover:bg-gray-50/50">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                        #{String(order._id).slice(-8).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-800">
                                        {formatCurrency(order.amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusBadgeClass(order.status)}`}>
                                            {getOrderStatusDisplay(order.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
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
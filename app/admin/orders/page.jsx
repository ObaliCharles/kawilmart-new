'use client'
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { OrdersManagementPageSkeleton } from '@/components/dashboard/DashboardSkeletons';
import { getOrderStatusBadgeClass, getOrderStatusDisplay } from '@/lib/orderUi';

export default function AdminOrders() {
    const { getToken, user, authReady, formatCurrency } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        if (authReady && user) fetchOrders();
        // Orders/riders refresh when auth state changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, user]);

    const fetchOrders = async () => {
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };
            const [{ data: orderData }, { data: userData }] = await Promise.all([
                axios.get('/api/admin/orders', { headers }),
                axios.get('/api/admin/users', { headers }),
            ]);

            if (orderData.success) {
                setOrders(orderData.orders);
            } else {
                toast.error(orderData.message);
            }

            if (userData.success) {
                setRiders(userData.users.filter((account) => account.role === 'rider' || account.role === 'admin'));
            } else {
                toast.error(userData.message);
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateOrder = async (orderId, updates) => {
        setUpdatingId(orderId);
        try {
            const token = await getToken();
            const { data } = await axios.put('/api/admin/orders',
                { orderId, ...updates },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                setOrders(prev => prev.map((order) => order._id === orderId
                    ? { ...order, ...data.order }
                    : order
                ));
                toast.success(data.message || 'Order updated');
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = filterStatus === 'All' ? orders : orders.filter(o => o.status === filterStatus);

    if (loading) return <OrdersManagementPageSkeleton showTabs />;

    return (
        <div className="max-w-7xl space-y-4">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-gray-950">All Orders</h1>
                <p className="mt-0.5 text-xs text-gray-500">{filtered.length} order{filtered.length === 1 ? '' : 's'}</p>
            </div>

            {/* Status Filter Tabs */}
            <div className="scrollbar-none -mx-3 flex gap-1.5 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
                {['All', ...new Set(orders.map((order) => order.status))].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            filterStatus === s
                                ? 'bg-gray-950 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {s === 'All' ? s : getOrderStatusDisplay(s)}
                        {s !== 'All' && (
                            <span className="ml-1 text-[10px] opacity-70">
                                {orders.filter(o => o.status === s).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Mobile: card list */}
            <div className="space-y-2.5 lg:hidden">
                {filtered.length === 0 ? (
                    <div className="rounded-xl bg-white py-12 text-center text-sm text-gray-400 ring-1 ring-gray-100">
                        No orders found
                    </div>
                ) : filtered.map((order) => (
                    <div key={order._id} className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-mono text-[11px] text-gray-500">#{String(order._id).slice(-8).toUpperCase()}</p>
                                <p className="mt-0.5 line-clamp-2 text-xs font-medium text-gray-900">
                                    {order.items.map((item) => `${item.product?.name || 'Deleted Product'} ×${item.quantity}`).join(', ')}
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-xs font-bold text-gray-950">{formatCurrency(order.amount)}</p>
                                <p className="text-[10px] text-gray-400">{new Date(order.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getOrderStatusBadgeClass(order.status)}`}>
                                {getOrderStatusDisplay(order.status)}
                            </span>
                            {order.address ? (
                                <span className="text-[10px] text-gray-400">{order.address.fullName} · {order.address.city}</span>
                            ) : null}
                            {order.riskFlags?.map((flag) => (
                                <span key={`${order._id}-${flag}`} className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                                    {flag.replace(/_/g, ' ')}
                                </span>
                            ))}
                        </div>
                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                            <select
                                value={order.riderId || ''}
                                disabled={updatingId === order._id || (!order.actions?.canAssignRider && !order.riderId)}
                                onChange={(e) => updateOrder(order._id, { riderId: e.target.value })}
                                className="w-full cursor-pointer rounded-lg bg-gray-50 px-2 py-1.5 text-[11px] font-medium text-gray-700 outline-none disabled:opacity-60"
                            >
                                <option value="">Unassigned rider</option>
                                {riders.map((rider) => (
                                    <option
                                        key={rider.id}
                                        value={rider.id}
                                        disabled={rider.riderAvailability === 'busy' && rider.id !== order.riderId}
                                    >
                                        {(rider.name || rider.email)}{rider.riderAvailability === 'busy' && rider.id !== order.riderId ? ' · Busy' : ''}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={order.status}
                                disabled={updatingId === order._id}
                                onChange={(e) => updateOrder(order._id, { status: e.target.value })}
                                className="w-full cursor-pointer rounded-lg bg-gray-50 px-2 py-1.5 text-[11px] font-medium text-gray-700 outline-none disabled:opacity-60"
                            >
                                {[...new Set([order.status, ...(order.actions?.allowedNextStatuses || [])])].map((statusOption) => (
                                    <option key={statusOption} value={statusOption}>
                                        {getOrderStatusDisplay(statusOption)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop: orders table */}
            <div className="hidden overflow-hidden rounded-xl bg-white ring-1 ring-gray-100 lg:block">
                <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50/60">
                            <tr>
                                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Order</th>
                                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Items</th>
                                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Address</th>
                                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Amount</th>
                                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Date</th>
                                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Rider</th>
                                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">
                                        <span className="text-4xl block mb-2">📭</span>
                                        No orders found
                                    </td>
                                </tr>
                            ) : filtered.map((order) => (
                                <tr key={order._id} className="border-t border-gray-50 hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <p className="font-mono text-xs text-gray-500">#{String(order._id).slice(-8).toUpperCase()}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">User: {String(order.userId).slice(-6)}</p>
                                        {order.riskFlags?.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {order.riskFlags.map((flag) => (
                                                    <span key={`${order._id}-${flag}`} className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700">
                                                        {flag.replace(/_/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 max-w-[200px]">
                                        {order.items.map((item, i) => (
                                            <p key={i} className="truncate text-gray-700">
                                                {item.product?.name || 'Deleted Product'} ×{item.quantity}
                                            </p>
                                        ))}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                        {order.address ? (
                                            <>
                                                <p className="font-medium">{order.address.fullName}</p>
                                                <p>{order.address.city}, {order.address.state}</p>
                                                <p>{order.address.phoneNumber}</p>
                                            </>
                                        ) : '—'}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-gray-800">
                                        {formatCurrency(order.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {new Date(order.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={order.riderId || ''}
                                            disabled={updatingId === order._id || (!order.actions?.canAssignRider && !order.riderId)}
                                            onChange={(e) => updateOrder(order._id, { riderId: e.target.value })}
                                            className="min-w-[150px] text-xs font-medium px-2 py-1.5 rounded-lg border border-gray-200 outline-none cursor-pointer bg-white md:min-w-[170px]"
                                        >
                                            <option value="">Unassigned</option>
                                            {riders.map((rider) => (
                                                <option
                                                    key={rider.id}
                                                    value={rider.id}
                                                    disabled={rider.riderAvailability === 'busy' && rider.id !== order.riderId}
                                                >
                                                    {(rider.name || rider.email)}{rider.riderAvailability === 'busy' && rider.id !== order.riderId ? ' · Busy' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="space-y-2">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusBadgeClass(order.status)}`}>
                                                {getOrderStatusDisplay(order.status)}
                                            </span>
                                            <select
                                                value={order.status}
                                                disabled={updatingId === order._id}
                                                onChange={(e) => updateOrder(order._id, { status: e.target.value })}
                                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium outline-none cursor-pointer"
                                            >
                                                {[...new Set([order.status, ...(order.actions?.allowedNextStatuses || [])])].map((statusOption) => (
                                                    <option key={statusOption} value={statusOption}>
                                                        {getOrderStatusDisplay(statusOption)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
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

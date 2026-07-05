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
        <div className="space-y-6 max-w-7xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
                    <p className="text-sm text-gray-500 mt-1">{filtered.length} orders</p>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {['All', ...new Set(orders.map((order) => order.status))].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                            filterStatus === s
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {s === 'All' ? s : getOrderStatusDisplay(s)}
                        {s !== 'All' && (
                            <span className="ml-1.5 text-xs opacity-75">
                                ({orders.filter(o => o.status === s).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-5 py-4 text-gray-500 font-medium">Order</th>
                                <th className="text-left px-5 py-4 text-gray-500 font-medium">Items</th>
                                <th className="text-left px-5 py-4 text-gray-500 font-medium">Address</th>
                                    <th className="text-left px-5 py-4 text-gray-500 font-medium">Amount</th>
                                    <th className="text-left px-5 py-4 text-gray-500 font-medium">Date</th>
                                    <th className="text-left px-5 py-4 text-gray-500 font-medium">Rider</th>
                                    <th className="text-left px-5 py-4 text-gray-500 font-medium">Status</th>
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
                                    <td className="px-5 py-4">
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
                                    <td className="px-5 py-4 max-w-[200px]">
                                        {order.items.map((item, i) => (
                                            <p key={i} className="truncate text-gray-700">
                                                {item.product?.name || 'Deleted Product'} ×{item.quantity}
                                            </p>
                                        ))}
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 text-xs">
                                        {order.address ? (
                                            <>
                                                <p className="font-medium">{order.address.fullName}</p>
                                                <p>{order.address.city}, {order.address.state}</p>
                                                <p>{order.address.phoneNumber}</p>
                                            </>
                                        ) : '—'}
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-gray-800">
                                        {formatCurrency(order.amount)}
                                    </td>
                                    <td className="px-5 py-4 text-gray-500 text-xs">
                                        {new Date(order.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-4">
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
                                    <td className="px-5 py-4">
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

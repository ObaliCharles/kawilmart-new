'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import axios from "axios";
import toast from "react-hot-toast";
import { OrdersManagementPageSkeleton } from "@/components/dashboard/DashboardSkeletons";
import {
    getOrderStatusBadgeClass,
    getOrderStatusDisplay,
    getPaymentStatusBadgeClass,
    getRiderAssignmentBadgeClass,
} from "@/lib/orderUi";
import { getOrderStatusLabel } from "@/lib/orderLifecycle";

const paymentStatusOptions = ['Pending', 'Paid', 'Failed'];

const Orders = () => {
    const { getToken, user, authReady, formatCurrency } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingState, setUpdatingState] = useState({ orderId: "", field: "" });

    const fetchSellerOrders = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/order/seller-orders', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                setOrders(data.orders || []);
                setRiders(data.riders || []);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateOrder = async (orderId, updates, field) => {
        setUpdatingState({ orderId, field });

        try {
            const token = await getToken();
            const { data } = await axios.put(
                '/api/order/seller-orders',
                { orderId, ...updates },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(data.message);
                await fetchSellerOrders();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to update order');
        } finally {
            setUpdatingState({ orderId: "", field: "" });
        }
    };

    useEffect(() => {
        if (authReady && user) {
            void fetchSellerOrders();
        }
    }, [authReady, user]);

    return (
        <div className="flex min-h-screen flex-1 flex-col justify-between text-sm">
            {loading ? <div className="p-4 md:p-10"><OrdersManagementPageSkeleton /></div> : (
                <div className="space-y-5 p-4 md:p-10">
                    <div>
                        <h2 className="text-lg font-medium">Orders</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Accept orders, move them through the lifecycle, assign riders, and unlock contact details only when appropriate.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">
                                No orders yet
                            </div>
                        ) : orders.map((order) => {
                            const isUpdatingOrder = updatingState.orderId === order._id;

                            return (
                                <div key={order._id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr_0.9fr_1fr]">
                                        <div className="flex min-w-0 gap-4">
                                            <Image
                                                className="h-16 w-16 shrink-0 object-cover"
                                                src={assets.box_icon}
                                                alt="box_icon"
                                                width={64}
                                                height={64}
                                            />
                                            <div className="min-w-0 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium text-gray-900 break-words">
                                                        {order.items.map((item) => `${item.product?.name || 'Deleted Product'} x ${item.quantity}`).join(", ")}
                                                    </p>
                                                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getOrderStatusBadgeClass(order.status)}`}>
                                                        {getOrderStatusDisplay(order.status)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Order #{String(order._id).slice(-8).toUpperCase()}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {order.deliveryModeLabel} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items · Delivery fee {formatCurrency(order.deliveryFee)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Commission on completion: {formatCurrency(order.commissionAmount)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div>
                                                <p className="font-medium text-gray-800">{order.address?.fullName || 'Customer'}</p>
                                                <p>{order.address?.area || 'No area yet'}</p>
                                                <p>{order.address ? `${order.address.city}, ${order.address.state}` : 'No location'}</p>
                                            </div>
                                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-xs">
                                                <p className="font-semibold uppercase tracking-wide text-gray-400">Customer Contact</p>
                                                <p className="mt-2 text-gray-700">
                                                    {order.customerContactUnlocked
                                                        ? (order.address?.phoneNumber || order.customerPhone || 'Phone not available')
                                                        : 'Unlocks after you accept this order'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                                <p className="font-semibold text-gray-900">{formatCurrency(order.amount)}</p>
                                                <p>Subtotal: {formatCurrency(order.subtotal)}</p>
                                                <p>Date: {new Date(order.date).toLocaleDateString()}</p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                    Payment Status
                                                </p>
                                                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                                                    {order.paymentStatus}
                                                </span>
                                                <select
                                                    value={order.paymentStatus || 'Pending'}
                                                    disabled={isUpdatingOrder}
                                                    onChange={(event) => void updateOrder(order._id, { paymentStatus: event.target.value }, 'payment')}
                                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
                                                >
                                                    {paymentStatusOptions.map((status) => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Rider Assignment</p>
                                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getRiderAssignmentBadgeClass(order.riderAssignmentStatus, order.riderId)}`}>
                                                        {order.riderAssignmentStatus}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm font-medium text-gray-900">{order.rider?.name || 'Not assigned yet'}</p>
                                                <p className="text-xs text-gray-500">
                                                    {order.rider?.phoneNumber || 'Rider contact appears after assignment'}
                                                </p>

                                                {order.actions?.canAssignRider ? (
                                                    <select
                                                        value={order.riderId || ''}
                                                        disabled={isUpdatingOrder}
                                                        onChange={(event) => void updateOrder(order._id, { riderId: event.target.value }, 'rider')}
                                                        className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {riders.map((rider) => (
                                                            <option
                                                                key={rider.id}
                                                                value={rider.id}
                                                                disabled={!rider.isAvailable && rider.id !== order.riderId}
                                                            >
                                                                {rider.name}{rider.isAvailable ? '' : ' · Busy'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <p className="mt-3 text-xs text-gray-500">
                                                        Rider assignment becomes available after the order is accepted.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {(order.actions?.allowedNextStatuses || []).map((status) => (
                                            <button
                                                key={`${order._id}-${status}`}
                                                onClick={() => void updateOrder(order._id, { status }, 'status')}
                                                disabled={isUpdatingOrder}
                                                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                                    status === 'FAILED'
                                                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                                } disabled:cursor-wait disabled:opacity-60`}
                                            >
                                                {isUpdatingOrder && updatingState.field === 'status' ? 'Saving...' : getOrderStatusLabel(status)}
                                            </button>
                                        ))}
                                    </div>

                                    {order.riskFlags?.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {order.riskFlags.map((flag) => (
                                                <span key={`${order._id}-${flag}`} className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                                                    {flag.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default Orders;

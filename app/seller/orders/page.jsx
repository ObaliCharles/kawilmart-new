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
            {loading ? <div className="p-3 sm:p-4 md:p-6"><OrdersManagementPageSkeleton /></div> : (
                <div className="space-y-4 p-3 sm:p-4 md:p-6">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-gray-950">Orders</h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Accept orders, move them through the lifecycle, and assign riders.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {orders.length === 0 ? (
                            <div className="rounded-xl bg-white py-14 text-center text-sm text-gray-400 ring-1 ring-gray-100">
                                No orders yet
                            </div>
                        ) : orders.map((order) => {
                            const isUpdatingOrder = updatingState.orderId === order._id;
                            const firstItemImage = order.items.find((item) => item.product?.image?.[0])?.product?.image?.[0];

                            return (
                                <div key={order._id} className="rounded-xl bg-white p-3.5 ring-1 ring-gray-100 sm:p-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_0.9fr_1fr]">
                                        <div className="flex min-w-0 gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                                                {firstItemImage ? (
                                                    <Image
                                                        className="h-full w-full object-cover"
                                                        src={firstItemImage}
                                                        alt="Order item"
                                                        width={48}
                                                        height={48}
                                                    />
                                                ) : (
                                                    <Image
                                                        className="h-8 w-8 object-contain"
                                                        src={assets.box_icon}
                                                        alt="box_icon"
                                                        width={32}
                                                        height={32}
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="line-clamp-2 text-[13px] font-medium text-gray-950">
                                                        {order.items.map((item) => `${item.product?.name || 'Deleted Product'} x ${item.quantity}`).join(", ")}
                                                    </p>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getOrderStatusBadgeClass(order.status)}`}>
                                                        {getOrderStatusDisplay(order.status)}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-500">
                                                    #{String(order._id).slice(-8).toUpperCase()}
                                                    <span className="mx-1 text-gray-300">·</span>
                                                    {order.deliveryModeLabel} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                                                </p>
                                                <p className="text-[11px] text-gray-500">
                                                    Delivery fee {formatCurrency(order.deliveryFee)} · Commission {formatCurrency(order.commissionAmount)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-[13px] text-gray-600">
                                            <div>
                                                <p className="font-medium text-gray-900">{order.address?.fullName || 'Customer'}</p>
                                                <p className="text-xs text-gray-500">
                                                    {[order.address?.area, order.address?.city, order.address?.state].filter(Boolean).join(', ') || 'No location'}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-gray-50/80 p-2.5 text-xs">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Customer Contact</p>
                                                <p className="mt-1 text-gray-700">
                                                    {order.customerContactUnlocked
                                                        ? (order.address?.phoneNumber || order.customerPhone || 'Phone not available')
                                                        : 'Unlocks after you accept this order'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="rounded-lg bg-gray-50/80 p-2.5 text-xs text-gray-600">
                                                <p className="text-sm font-semibold text-gray-950">{formatCurrency(order.amount)}</p>
                                                <p className="mt-0.5">Subtotal {formatCurrency(order.subtotal)}</p>
                                                <p>{new Date(order.date).toLocaleDateString()}</p>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Payment</p>
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                                                        {order.paymentStatus}
                                                    </span>
                                                </div>
                                                <select
                                                    value={order.paymentStatus || 'Pending'}
                                                    disabled={isUpdatingOrder}
                                                    onChange={(event) => void updateOrder(order._id, { paymentStatus: event.target.value }, 'payment')}
                                                    className="mt-1.5 w-full cursor-pointer rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 outline-none disabled:opacity-60"
                                                >
                                                    {paymentStatusOptions.map((status) => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-gray-50/80 p-2.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Rider</p>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getRiderAssignmentBadgeClass(order.riderAssignmentStatus, order.riderId)}`}>
                                                    {order.riderAssignmentStatus}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs font-medium text-gray-900">{order.rider?.name || 'Not assigned yet'}</p>
                                            <p className="text-[11px] text-gray-500">
                                                {order.rider?.phoneNumber || 'Contact appears after assignment'}
                                            </p>

                                            {order.actions?.canAssignRider ? (
                                                <select
                                                    value={order.riderId || ''}
                                                    disabled={isUpdatingOrder}
                                                    onChange={(event) => void updateOrder(order._id, { riderId: event.target.value }, 'rider')}
                                                    className="mt-2 w-full cursor-pointer rounded-lg bg-white px-2.5 py-1.5 text-xs outline-none ring-1 ring-gray-100 disabled:opacity-60"
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
                                                <p className="mt-2 text-[11px] text-gray-400">
                                                    Available after the order is accepted.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {(order.actions?.allowedNextStatuses || []).length > 0 || order.riskFlags?.length > 0 ? (
                                        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-50 pt-3">
                                            {(order.actions?.allowedNextStatuses || []).map((status) => (
                                                <button
                                                    key={`${order._id}-${status}`}
                                                    onClick={() => void updateOrder(order._id, { status }, 'status')}
                                                    disabled={isUpdatingOrder}
                                                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                                                        status === 'FAILED'
                                                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                                            : 'bg-orange-600 text-white hover:bg-orange-700'
                                                    } disabled:cursor-wait disabled:opacity-60`}
                                                >
                                                    {isUpdatingOrder && updatingState.field === 'status' ? 'Saving...' : getOrderStatusLabel(status)}
                                                </button>
                                            ))}
                                            {order.riskFlags?.map((flag) => (
                                                <span key={`${order._id}-${flag}`} className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-medium text-red-700">
                                                    {flag.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
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

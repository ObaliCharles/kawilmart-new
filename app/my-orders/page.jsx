'use client';
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import axios from "axios";
import toast from "react-hot-toast";
import { OrdersPageSkeleton } from "@/components/PageSkeletons";
import { CUSTOMER_TRACKING_STEPS, getCustomerTrackingStepIndex } from "@/lib/orderTracking";
import { isTerminalOrderStatus } from "@/lib/orderLifecycle";
import {
    getOrderStatusBadgeClass,
    getOrderStatusDisplay,
    getPaymentStatusBadgeClass,
    getRiderAssignmentBadgeClass,
} from "@/lib/orderUi";

const defaultReviewState = {
    reliability: 5,
    speed: 5,
    communication: 5,
    comment: "",
};

const scoreOptions = [1, 2, 3, 4, 5];

const MyOrders = () => {
    const { getToken, user, authReady, formatCurrency } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionOrderId, setActionOrderId] = useState("");
    const [reviewForms, setReviewForms] = useState({});

    const fetchOrders = async ({ silent = false, background = false } = {}) => {
        try {
            if (background) {
                setRefreshing(true);
            }

            const token = await getToken();
            const { data } = await axios.get('/api/order/list', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                setOrders(data.orders || []);
            } else if (!silent) {
                toast.error(data.message);
            }
        } catch (error) {
            if (!silent) {
                toast.error(error.message);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (authReady && user) {
            void fetchOrders();
        }
    }, [authReady, user]);

    const hasActiveOrders = orders.some((order) => !isTerminalOrderStatus(order.status));
    const activeOrdersCount = orders.filter((order) => !isTerminalOrderStatus(order.status)).length;

    useEffect(() => {
        if (!authReady || !user || !hasActiveOrders) {
            return undefined;
        }

        const interval = window.setInterval(() => {
            void fetchOrders({ silent: true, background: true });
        }, 20000);

        return () => window.clearInterval(interval);
    }, [authReady, user, hasActiveOrders]);

    const updateReviewForm = (orderId, field, value) => {
        setReviewForms((current) => ({
            ...current,
            [orderId]: {
                ...(current[orderId] || defaultReviewState),
                [field]: value,
            },
        }));
    };

    const runCustomerAction = async (orderId, payload, successMessage) => {
        setActionOrderId(orderId);

        try {
            const token = await getToken();
            const { data } = await axios.post(
                '/api/order/customer-action',
                { orderId, ...payload },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(data.message || successMessage);
                await fetchOrders({ background: true, silent: true });
                return true;
            }

            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to update order');
            return false;
        } finally {
            setActionOrderId("");
        }
    };

    const handleConfirmDelivery = async (orderId) => {
        await runCustomerAction(orderId, { action: "CONFIRM_DELIVERY" }, "Delivery confirmed successfully");
    };

    const handleSubmitReview = async (orderId) => {
        const review = reviewForms[orderId] || defaultReviewState;
        const success = await runCustomerAction(orderId, {
            action: "SUBMIT_SELLER_REVIEW",
            review,
        }, "Seller review submitted successfully");

        if (success) {
            setReviewForms((current) => ({
                ...current,
                [orderId]: defaultReviewState,
            }));
        }
    };

    return (
        <>
            <Navbar />
            <div className="flex min-h-screen flex-col justify-between px-6 py-6 md:px-16 lg:px-32">
                <div className="space-y-5">
                    <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900">My Orders</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Track every order from placement through seller acceptance, delivery, and final confirmation.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {activeOrdersCount > 0 && (
                                <span className="rounded-full bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                                    Auto-refreshing {activeOrdersCount} active order{activeOrdersCount === 1 ? '' : 's'} every 20s
                                </span>
                            )}
                            <button
                                onClick={() => void fetchOrders({ background: true })}
                                disabled={refreshing}
                                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                    refreshing
                                        ? 'cursor-wait border-gray-200 text-gray-400'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {refreshing ? 'Refreshing...' : 'Refresh tracking'}
                            </button>
                        </div>
                    </div>

                    {loading ? <OrdersPageSkeleton titleWidth="w-32" /> : (
                        <div className="max-w-6xl space-y-6">
                            {orders.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400">
                                    No orders yet
                                </div>
                            ) : orders.map((order) => {
                                const currentStep = getCustomerTrackingStepIndex(order.status);
                                const latestTrackingEvent = order.trackingEvents?.[order.trackingEvents.length - 1];
                                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                                const reviewForm = reviewForms[order._id] || defaultReviewState;

                                return (
                                    <div key={order._id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        Order #{String(order._id).slice(-8).toUpperCase()}
                                                    </h3>
                                                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getOrderStatusBadgeClass(order.status)}`}>
                                                        {getOrderStatusDisplay(order.status)}
                                                    </span>
                                                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                                                        {order.paymentStatus}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Placed on {new Date(order.date).toLocaleString()}
                                                </p>
                                                {latestTrackingEvent?.timestamp && (
                                                    <p className="text-xs text-gray-400">
                                                        Last tracking update: {new Date(latestTrackingEvent.timestamp).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                                <p className="font-semibold text-gray-900">{formatCurrency(order.amount)}</p>
                                                <p>{totalItems} item{totalItems === 1 ? '' : 's'}</p>
                                                <p>{order.deliveryModeLabel} · Delivery fee {formatCurrency(order.deliveryFee)}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
                                            {CUSTOMER_TRACKING_STEPS.map((step, index) => {
                                                const complete = index <= currentStep && order.status !== 'CANCELLED';
                                                const isCurrent = index === currentStep && order.status !== 'CANCELLED';

                                                return (
                                                    <div key={step.label} className="flex flex-col items-center gap-2 text-center">
                                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                                                            order.status === 'CANCELLED'
                                                                ? 'bg-red-100 text-red-600'
                                                                : complete
                                                                    ? 'bg-orange-600 text-white'
                                                                    : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                            {index + 1}
                                                        </div>
                                                        <p className={`text-xs ${isCurrent ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                                            {step.label}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr_0.9fr_1fr]">
                                            <div>
                                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Items</p>
                                                <div className="space-y-2">
                                                    {order.items.map((item, index) => (
                                                        <div key={`${order._id}-${index}`} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                                                            {item.product?.image?.[0] ? (
                                                                <Image
                                                                    src={item.product.image[0]}
                                                                    alt={item.product.name}
                                                                    width={48}
                                                                    height={48}
                                                                    className="h-12 w-12 rounded-xl object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-12 w-12 rounded-xl bg-gray-200" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium text-gray-900">{item.product?.name || 'Deleted Product'}</p>
                                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                                {item.product?.location && (
                                                                    <p className="text-xs text-gray-400">From: {item.product.location}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Delivery Address</p>
                                                <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                                                    <p className="font-semibold text-gray-900">{order.address?.fullName || 'No address'}</p>
                                                    <p>{order.address?.area || ''}</p>
                                                    <p>{[order.address?.city, order.address?.state].filter(Boolean).join(', ')}</p>
                                                    <p>{order.address?.phoneNumber || order.customerPhone || ''}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Marketplace Contacts</p>
                                                <div className="space-y-3">
                                                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                                                        <p className="text-xs uppercase tracking-wide text-gray-400">Seller</p>
                                                        <p className="mt-1 font-semibold text-gray-900">{order.seller?.name || 'Seller'}</p>
                                                        <p>{order.seller?.location || 'Location not available'}</p>
                                                        <p>
                                                            {order.seller?.contactUnlocked
                                                                ? (order.seller?.phoneNumber || 'Phone not available')
                                                                : 'Unlocks after the seller accepts this order'}
                                                        </p>
                                                        <p className="mt-2 text-xs text-gray-400">
                                                            Seller rating: {order.seller?.ratingSummary?.overall || 0} / 5
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div>
                                                                <p className="text-xs uppercase tracking-wide text-gray-400">Rider</p>
                                                                <p className="mt-1 font-semibold text-gray-900">{order.rider?.name || 'Not assigned yet'}</p>
                                                            </div>
                                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getRiderAssignmentBadgeClass(order.riderAssignmentStatus, order.riderId)}`}>
                                                                {order.riderAssignmentStatus}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2">
                                                            {order.rider?.contactUnlocked
                                                                ? (order.rider?.phoneNumber || 'Phone not available')
                                                                : 'Visible once the assigned rider accepts the job'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Tracking Timeline</p>
                                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                                    <div className="space-y-4">
                                                        {(order.trackingEvents || []).slice().reverse().map((event) => (
                                                            <div key={event.id} className="relative pl-5">
                                                                <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-orange-500" />
                                                                <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                                                                <p className="text-sm text-gray-600">{event.description}</p>
                                                                <p className="mt-1 text-xs text-gray-400">
                                                                    {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Just now'}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {order.actions?.canConfirmDelivery && (
                                            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="font-semibold text-emerald-900">Confirm receipt to complete the order</p>
                                                        <p className="text-sm text-emerald-700">
                                                            The seller or rider marked this as delivered. Confirm only after you have the items.
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => void handleConfirmDelivery(order._id)}
                                                        disabled={actionOrderId === order._id}
                                                        className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
                                                    >
                                                        {actionOrderId === order._id ? 'Saving...' : 'Confirm Delivery'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {order.actions?.canReviewSeller && !order.sellerReview && (
                                            <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                                                <p className="font-semibold text-gray-900">Rate this seller</p>
                                                <p className="mt-1 text-sm text-gray-600">
                                                    Your review improves trust for future customers.
                                                </p>

                                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                                                    {[
                                                        { key: 'reliability', label: 'Reliability' },
                                                        { key: 'speed', label: 'Speed' },
                                                        { key: 'communication', label: 'Communication' },
                                                    ].map((field) => (
                                                        <label key={field.key} className="text-sm text-gray-700">
                                                            <span className="mb-2 block font-medium">{field.label}</span>
                                                            <select
                                                                value={reviewForm[field.key]}
                                                                onChange={(event) => updateReviewForm(order._id, field.key, Number(event.target.value))}
                                                                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-3 outline-none transition focus:border-orange-400"
                                                            >
                                                                {scoreOptions.map((score) => (
                                                                    <option key={score} value={score}>{score}/5</option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                    ))}
                                                </div>

                                                <label className="mt-4 block text-sm text-gray-700">
                                                    <span className="mb-2 block font-medium">Comment</span>
                                                    <textarea
                                                        rows={3}
                                                        value={reviewForm.comment}
                                                        onChange={(event) => updateReviewForm(order._id, 'comment', event.target.value)}
                                                        className="w-full resize-none rounded-xl border border-orange-200 bg-white px-3 py-3 outline-none transition focus:border-orange-400"
                                                        placeholder="How was your experience with this seller?"
                                                    />
                                                </label>

                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        onClick={() => void handleSubmitReview(order._id)}
                                                        disabled={actionOrderId === order._id}
                                                        className="rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-70"
                                                    >
                                                        {actionOrderId === order._id ? 'Saving...' : 'Submit Seller Review'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {order.sellerReview && (
                                            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                                                <p className="font-semibold text-gray-900">Your seller review</p>
                                                <p className="mt-2">
                                                    Reliability {order.sellerReview.reliability}/5 · Speed {order.sellerReview.speed}/5 · Communication {order.sellerReview.communication}/5
                                                </p>
                                                {order.sellerReview.comment ? (
                                                    <p className="mt-2 text-gray-600">{order.sellerReview.comment}</p>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <Footer />
            </div>
        </>
    );
};

export default MyOrders;

'use client';
import React, { useEffect, useMemo, useState } from "react";
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

const RETURN_REASONS = [
    "Damaged or defective",
    "Wrong item received",
    "Not as described",
    "No longer needed",
    "Other",
];

const defaultReturnState = { reason: RETURN_REASONS[0], note: "" };

const returnStatusStyles = {
    REQUESTED: "bg-amber-50 text-amber-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REFUNDED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-rose-50 text-rose-700",
};

const returnStatusLabels = {
    REQUESTED: "Return requested",
    APPROVED: "Return approved",
    REFUNDED: "Refunded",
    REJECTED: "Return declined",
};

const scoreOptions = [1, 2, 3, 4, 5];

const formatOrderDate = (value) => new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
});

const formatOrderTime = (value) => new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
});

const OrderProgress = ({ order }) => {
    const currentStep = getCustomerTrackingStepIndex(order.status);
    const isCancelled = order.status === 'CANCELLED';
    const totalSteps = CUSTOMER_TRACKING_STEPS.length;
    const progress = isCancelled ? 0 : Math.min(100, ((currentStep + 1) / totalSteps) * 100);
    const currentLabel = isCancelled
        ? 'Cancelled'
        : CUSTOMER_TRACKING_STEPS[currentStep]?.label || 'Processing';

    return (
        <div className="mt-3">
            <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className={`font-medium ${isCancelled ? 'text-red-600' : 'text-orange-600'}`}>
                    {currentLabel}
                </span>
                {!isCancelled ? (
                    <span className="text-gray-400">
                        Step {currentStep + 1} of {totalSteps}
                    </span>
                ) : null}
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-100">
                <div
                    className={`h-full rounded-full transition-all ${isCancelled ? 'bg-red-400' : 'bg-orange-500'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

const ItemThumbnails = ({ items }) => {
    const visible = items.slice(0, 3);
    const overflow = items.length - visible.length;

    return (
        <div className="flex items-center">
            {visible.map((item, index) => (
                <div
                    key={`${item.product?._id || index}-${index}`}
                    className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 ${index > 0 ? '-ml-2 ring-2 ring-white' : ''}`}
                >
                    {item.product?.image?.[0] ? (
                        <Image
                            src={item.product.image[0]}
                            alt={item.product.name || 'Product'}
                            width={36}
                            height={36}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-[10px] font-bold text-gray-400">?</span>
                    )}
                </div>
            ))}
            {overflow > 0 ? (
                <span className="ml-1.5 text-[11px] font-medium text-gray-400">+{overflow}</span>
            ) : null}
        </div>
    );
};

const MyOrders = () => {
    const { getToken, user, authReady, formatCurrency } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionOrderId, setActionOrderId] = useState("");
    const [reviewForms, setReviewForms] = useState({});
    const [returnForms, setReturnForms] = useState({});
    const [openReturnFormId, setOpenReturnFormId] = useState("");
    const [expandedOrderId, setExpandedOrderId] = useState("");
    const [filter, setFilter] = useState("all");

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

    const filteredOrders = useMemo(() => {
        if (filter === "active") {
            return orders.filter((order) => !isTerminalOrderStatus(order.status));
        }

        return orders;
    }, [filter, orders]);

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

    const updateReturnForm = (orderId, field, value) => {
        setReturnForms((current) => ({
            ...current,
            [orderId]: { ...(current[orderId] || defaultReturnState), [field]: value },
        }));
    };

    const handleRequestReturn = async (orderId) => {
        const form = returnForms[orderId] || defaultReturnState;
        const success = await runCustomerAction(orderId, {
            action: "REQUEST_RETURN",
            returnReason: form.reason,
            returnNote: form.note,
        }, "Return request submitted");

        if (success) {
            setOpenReturnFormId("");
        }
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

    const toggleExpanded = (orderId) => {
        setExpandedOrderId((current) => (current === orderId ? "" : orderId));
    };

    return (
        <>
            <Navbar hideMobileHeader mobilePageTitle="Orders" />
            <main className="min-h-screen bg-white px-4 py-6 sm:px-6 md:px-10 lg:px-12">
                <div className="mx-auto max-w-3xl">
                    <header className="hidden items-start justify-between gap-4 md:flex">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-gray-950">Orders</h1>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {orders.length ? `${orders.length} total` : 'No orders yet'}
                                {activeOrdersCount > 0 ? ` · ${activeOrdersCount} in progress` : ''}
                            </p>
                        </div>

                        <button
                            onClick={() => void fetchOrders({ background: true })}
                            disabled={refreshing}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                                refreshing
                                    ? 'bg-gray-50 text-gray-400'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {refreshing ? 'Updating...' : 'Refresh'}
                        </button>
                    </header>

                    {orders.length > 0 && (
                        <div className="mt-5 inline-flex rounded-full bg-gray-100 p-1">
                            {[
                                ["all", "All"],
                                ["active", "Active"],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setFilter(value)}
                                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                        filter === value
                                            ? 'bg-white text-gray-950 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="mt-6">
                            <OrdersPageSkeleton titleWidth="w-32" />
                        </div>
                    ) : (
                        <div className="mt-5 divide-y divide-gray-100">
                            {filteredOrders.length === 0 ? (
                                <div className="py-16 text-center">
                                    <p className="text-sm text-gray-500">
                                        {filter === "active" ? 'No active orders right now.' : 'Your orders will show up here.'}
                                    </p>
                                </div>
                            ) : filteredOrders.map((order) => {
                                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                                const reviewForm = reviewForms[order._id] || defaultReviewState;
                                const isExpanded = expandedOrderId === order._id;
                                const latestEvent = order.trackingEvents?.[order.trackingEvents.length - 1];
                                const firstItemName = order.items[0]?.product?.name || 'Order items';

                                return (
                                    <article key={order._id} className="py-4 first:pt-0">
                                        <button
                                            type="button"
                                            onClick={() => toggleExpanded(order._id)}
                                            className="w-full text-left"
                                        >
                                            <div className="flex items-start gap-3">
                                                <ItemThumbnails items={order.items} />

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-gray-950">
                                                                {firstItemName}
                                                                {order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-gray-500">
                                                                #{String(order._id).slice(-8).toUpperCase()}
                                                                <span className="mx-1.5 text-gray-300">·</span>
                                                                {formatOrderDate(order.date)} at {formatOrderTime(order.date)}
                                                            </p>
                                                        </div>

                                                        <div className="shrink-0 text-right">
                                                            <p className="text-sm font-semibold text-gray-950">{formatCurrency(order.amount)}</p>
                                                            <p className="text-[11px] text-gray-400">{totalItems} item{totalItems === 1 ? '' : 's'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getOrderStatusBadgeClass(order.status)}`}>
                                                            {getOrderStatusDisplay(order.status)}
                                                        </span>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                                                            {order.paymentStatus}
                                                        </span>
                                                        {order.paymentMethodLabel ? (
                                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                                                                {order.paymentMethodLabel}
                                                            </span>
                                                        ) : null}
                                                        {order.returnRequest?.status && order.returnRequest.status !== "NONE" ? (
                                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${returnStatusStyles[order.returnRequest.status] || "bg-gray-100 text-gray-600"}`}>
                                                                {returnStatusLabels[order.returnRequest.status] || order.returnRequest.status}
                                                            </span>
                                                        ) : null}
                                                        <span className="text-[10px] text-gray-400">
                                                            {order.deliveryModeLabel}
                                                        </span>
                                                    </div>

                                                    <OrderProgress order={order} />

                                                    {latestEvent && !isExpanded ? (
                                                        <p className="mt-2 line-clamp-1 text-[11px] text-gray-400">
                                                            {latestEvent.title}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                <svg
                                                    className={`mt-1 h-4 w-4 shrink-0 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    aria-hidden="true"
                                                >
                                                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </button>

                                        {isExpanded ? (
                                            <div className="mt-4 space-y-4 rounded-2xl bg-gray-50/80 p-4">
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Items</p>
                                                        <div className="mt-2 space-y-2">
                                                            {order.items.map((item, index) => (
                                                                <div key={`${order._id}-${index}`} className="flex items-center gap-2.5">
                                                                    {item.product?.image?.[0] ? (
                                                                        <Image
                                                                            src={item.product.image[0]}
                                                                            alt={item.product.name}
                                                                            width={36}
                                                                            height={36}
                                                                            className="h-9 w-9 rounded-lg object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-9 w-9 rounded-lg bg-gray-200" />
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-sm text-gray-900">{item.product?.name || 'Deleted product'}</p>
                                                                        <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Delivery</p>
                                                        <div className="mt-2 text-sm text-gray-700">
                                                            <p className="font-medium text-gray-900">{order.address?.fullName || 'No address'}</p>
                                                            <p className="mt-0.5 text-xs leading-5 text-gray-500">
                                                                {[order.address?.area, order.address?.city, order.address?.state].filter(Boolean).join(', ')}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">{order.address?.phoneNumber || order.customerPhone || ''}</p>
                                                            <p className="mt-2 text-xs text-gray-500">
                                                                Fee {formatCurrency(order.deliveryFee)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Seller</p>
                                                        <div className="mt-2 text-sm">
                                                            <p className="font-medium text-gray-900">{order.seller?.name || 'Seller'}</p>
                                                            <p className="mt-0.5 text-xs text-gray-500">
                                                                {order.seller?.contactUnlocked
                                                                    ? (order.seller?.phoneNumber || 'Phone unavailable')
                                                                    : 'Contact unlocks after acceptance'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Rider</p>
                                                        <div className="mt-2 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-gray-900">{order.rider?.name || 'Not assigned'}</p>
                                                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getRiderAssignmentBadgeClass(order.riderAssignmentStatus, order.riderId)}`}>
                                                                    {order.riderAssignmentStatus}
                                                                </span>
                                                            </div>
                                                            <p className="mt-0.5 text-xs text-gray-500">
                                                                {order.rider?.contactUnlocked
                                                                    ? (order.rider?.phoneNumber || 'Phone unavailable')
                                                                    : 'Visible after rider accepts'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {(order.trackingEvents || []).length > 0 ? (
                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Activity</p>
                                                        <div className="mt-2 space-y-2">
                                                            {(order.trackingEvents || []).slice().reverse().slice(0, 5).map((event) => (
                                                                <div key={event.id} className="flex gap-2 text-xs">
                                                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">{event.title}</p>
                                                                        <p className="text-gray-500">{event.description}</p>
                                                                        <p className="mt-0.5 text-[10px] text-gray-400">
                                                                            {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Just now'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {order.actions?.canConfirmDelivery && (
                                                    <div className="flex flex-col gap-2 rounded-xl bg-emerald-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-emerald-900">Confirm you received this order</p>
                                                            <p className="text-xs text-emerald-700">Only confirm after items are in your hands.</p>
                                                        </div>
                                                        <button
                                                            onClick={() => void handleConfirmDelivery(order._id)}
                                                            disabled={actionOrderId === order._id}
                                                            className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
                                                        >
                                                            {actionOrderId === order._id ? 'Saving...' : 'Confirm received'}
                                                        </button>
                                                    </div>
                                                )}

                                                {order.actions?.canReviewSeller && !order.sellerReview && (
                                                    <div className="rounded-xl bg-white px-3 py-3">
                                                        <p className="text-sm font-medium text-gray-900">Rate seller</p>
                                                        <div className="mt-3 grid grid-cols-3 gap-2">
                                                            {[
                                                                { key: 'reliability', label: 'Reliability' },
                                                                { key: 'speed', label: 'Speed' },
                                                                { key: 'communication', label: 'Talk' },
                                                            ].map((field) => (
                                                                <label key={field.key} className="text-[11px] text-gray-600">
                                                                    <span className="mb-1 block">{field.label}</span>
                                                                    <select
                                                                        value={reviewForm[field.key]}
                                                                        onChange={(event) => updateReviewForm(order._id, field.key, Number(event.target.value))}
                                                                        className="w-full rounded-lg bg-gray-50 px-2 py-1.5 text-xs outline-none"
                                                                    >
                                                                        {scoreOptions.map((score) => (
                                                                            <option key={score} value={score}>{score}</option>
                                                                        ))}
                                                                    </select>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <textarea
                                                            rows={2}
                                                            value={reviewForm.comment}
                                                            onChange={(event) => updateReviewForm(order._id, 'comment', event.target.value)}
                                                            className="mt-2 w-full resize-none rounded-lg bg-gray-50 px-2.5 py-2 text-xs outline-none"
                                                            placeholder="Optional comment..."
                                                        />
                                                        <div className="mt-2 flex justify-end">
                                                            <button
                                                                onClick={() => void handleSubmitReview(order._id)}
                                                                disabled={actionOrderId === order._id}
                                                                className="rounded-full bg-gray-950 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-70"
                                                            >
                                                                {actionOrderId === order._id ? 'Saving...' : 'Submit'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {order.actions?.canRequestReturn ? (
                                                    <div className="rounded-xl bg-white px-3 py-3">
                                                        {openReturnFormId === order._id ? (
                                                            <>
                                                                <p className="text-sm font-medium text-gray-900">Request a return</p>
                                                                <select
                                                                    value={(returnForms[order._id] || defaultReturnState).reason}
                                                                    onChange={(event) => updateReturnForm(order._id, "reason", event.target.value)}
                                                                    className="mt-2 w-full rounded-lg bg-gray-50 px-2.5 py-2 text-xs outline-none"
                                                                >
                                                                    {RETURN_REASONS.map((reason) => (
                                                                        <option key={reason} value={reason}>{reason}</option>
                                                                    ))}
                                                                </select>
                                                                <textarea
                                                                    rows={2}
                                                                    value={(returnForms[order._id] || defaultReturnState).note}
                                                                    onChange={(event) => updateReturnForm(order._id, "note", event.target.value)}
                                                                    className="mt-2 w-full resize-none rounded-lg bg-gray-50 px-2.5 py-2 text-xs outline-none"
                                                                    placeholder="Tell the seller more (optional)..."
                                                                />
                                                                <div className="mt-2 flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => setOpenReturnFormId("")}
                                                                        className="rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() => void handleRequestReturn(order._id)}
                                                                        disabled={actionOrderId === order._id}
                                                                        className="rounded-full bg-gray-950 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-70"
                                                                    >
                                                                        {actionOrderId === order._id ? 'Sending...' : 'Submit request'}
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">Problem with this order?</p>
                                                                    <p className="text-xs text-gray-500">You can request a return within 7 days of delivery.</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => setOpenReturnFormId(order._id)}
                                                                    className="shrink-0 rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                                                                >
                                                                    Request return
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : null}

                                                {order.returnRequest?.status && order.returnRequest.status !== "NONE" ? (
                                                    <div className="rounded-xl bg-white px-3 py-3 text-xs text-gray-600">
                                                        <p className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${returnStatusStyles[order.returnRequest.status] || "bg-gray-100 text-gray-600"}`}>
                                                            {returnStatusLabels[order.returnRequest.status] || order.returnRequest.status}
                                                        </p>
                                                        <p className="mt-1.5"><span className="text-gray-400">Reason:</span> {order.returnRequest.reason}</p>
                                                        {order.returnRequest.note ? <p className="mt-0.5 text-gray-500">{order.returnRequest.note}</p> : null}
                                                        {order.returnRequest.resolutionNote ? (
                                                            <p className="mt-1"><span className="text-gray-400">Seller:</span> {order.returnRequest.resolutionNote}</p>
                                                        ) : null}
                                                    </div>
                                                ) : null}

                                                {order.sellerReview ? (
                                                    <div className="rounded-xl bg-white px-3 py-3 text-xs text-gray-600">
                                                        <p className="font-medium text-gray-900">Your review</p>
                                                        <p className="mt-1">
                                                            {order.sellerReview.reliability}/5 · {order.sellerReview.speed}/5 · {order.sellerReview.communication}/5
                                                        </p>
                                                        {order.sellerReview.comment ? (
                                                            <p className="mt-1 text-gray-500">{order.sellerReview.comment}</p>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
};

export default MyOrders;

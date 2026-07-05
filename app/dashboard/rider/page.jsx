'use client';
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import Link from 'next/link';
import { RiderDashboardSkeleton } from '@/components/dashboard/DashboardSkeletons';
import { getOrderStatusBadgeClass, getOrderStatusDisplay, getRiderAssignmentBadgeClass } from '@/lib/orderUi';
import { downloadAuthenticatedFile } from '@/lib/clientDownloads';

export default function RiderDashboard() {
    const { getToken, user, authReady, formatCurrency } = useAppContext();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');
    const [updatingId, setUpdatingId] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [riderAvailability, setRiderAvailability] = useState('available');
    const [availabilityUpdating, setAvailabilityUpdating] = useState(false);
    const [statementPeriodKey, setStatementPeriodKey] = useState('');
    const [downloadingStatement, setDownloadingStatement] = useState(false);

    const fetchDeliveries = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/rider/deliveries', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                setDeliveries(data.deliveries || []);
                setRiderAvailability(data.riderAvailability || 'available');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authReady && user) {
            void fetchDeliveries();
        }
    }, [authReady, user]);

    useEffect(() => {
        const currentDate = new Date();
        const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const completedPeriods = deliveries
            .filter((delivery) => ['DELIVERED', 'COMPLETED'].includes(delivery.status))
            .map((delivery) => {
                const date = new Date(delivery.deliveredAt || delivery.date || Date.now());
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            })
            .filter(Boolean);
        const nextPeriod = [currentPeriod, ...completedPeriods].sort((left, right) => right.localeCompare(left))[0];

        if (nextPeriod && !statementPeriodKey) {
            setStatementPeriodKey(nextPeriod);
        }
    }, [deliveries, statementPeriodKey]);

    const updateDelivery = async (orderId, payload, successMessage) => {
        setUpdatingId(orderId);
        try {
            const token = await getToken();
            const { data } = await axios.put(
                '/api/rider/deliveries',
                { orderId, ...payload },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(data.message || successMessage);
                await fetchDeliveries();
                if (payload.status === 'DELIVERED') {
                    setExpandedId(null);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to update delivery');
        } finally {
            setUpdatingId("");
        }
    };

    const updateAvailability = async (nextAvailability) => {
        if (availabilityUpdating || riderAvailability === nextAvailability) {
            return;
        }

        setAvailabilityUpdating(true);
        try {
            const token = await getToken();
            const { data } = await axios.put(
                '/api/rider/deliveries',
                { riderAvailability: nextAvailability },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setRiderAvailability(data.riderAvailability || nextAvailability);
                toast.success(data.message || 'Availability updated');
                await fetchDeliveries();
            } else {
                toast.error(data.message || 'Failed to update availability');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Failed to update availability');
        } finally {
            setAvailabilityUpdating(false);
        }
    };

    const active = deliveries.filter((delivery) => delivery.status !== 'COMPLETED');
    const completed = deliveries.filter((delivery) => delivery.status === 'COMPLETED');
    const displayed = activeTab === 'active' ? active : completed;
    const pendingAssignments = active.filter((delivery) => delivery.actions?.canAcceptAssignment).length;
    const onTheRoad = active.filter((delivery) => delivery.status === 'OUT_FOR_DELIVERY').length;
    const activeAcceptedTrips = active.filter((delivery) =>
        ['ACCEPTED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY'].includes(delivery.status)
            && delivery.riderAssignmentStatus === 'ACCEPTED'
    ).length;
    const totalDelivered = deliveries.filter((delivery) => ['DELIVERED', 'COMPLETED'].includes(delivery.status)).length;
    const totalPayout = deliveries
        .filter((delivery) => ['DELIVERED', 'COMPLETED'].includes(delivery.status))
        .reduce((sum, delivery) => sum + (delivery.deliveryPayout || 0), 0);
    const currentDate = new Date();
    const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const statementPeriodOptions = [...new Set([
        currentPeriod,
        ...deliveries
            .filter((delivery) => ['DELIVERED', 'COMPLETED'].includes(delivery.status))
            .map((delivery) => {
                const date = new Date(delivery.deliveredAt || delivery.date || Date.now());
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            })
            .filter(Boolean),
    ])].sort((left, right) => right.localeCompare(left));

    const handleStatementDownload = async () => {
        if (!statementPeriodKey || downloadingStatement) {
            return;
        }

        try {
            setDownloadingStatement(true);
            const token = await getToken();
            await downloadAuthenticatedFile({
                url: `/api/rider/invoices/download?periodKey=${encodeURIComponent(statementPeriodKey)}`,
                token,
                fallbackFilename: `kawilmart-rider-statement-${statementPeriodKey}.html`,
            });
            toast.success('Statement download started');
        } catch (error) {
            toast.error(error.message || 'Failed to download rider statement');
        } finally {
            setDownloadingStatement(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <RiderDashboardSkeleton />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 md:px-10 md:py-8 lg:px-20">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                riderAvailability === 'busy'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {riderAvailability === 'busy' ? 'BUSY' : 'AVAILABLE'}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
                        <p className="mt-1 text-sm text-gray-500">Accept jobs, unlock contacts after acceptance, and update delivery progress inside KawilMart.</p>
                    </div>
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                        <div className="rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
                            <div className="flex flex-wrap gap-1">
                                <button
                                    type="button"
                                    onClick={() => void updateAvailability('available')}
                                    disabled={availabilityUpdating || riderAvailability === 'available'}
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                        riderAvailability === 'available'
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    } ${availabilityUpdating ? 'cursor-wait opacity-70' : ''}`}
                                >
                                    Ready for work
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void updateAvailability('busy')}
                                    disabled={availabilityUpdating || riderAvailability === 'busy'}
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                        riderAvailability === 'busy'
                                            ? 'bg-orange-600 text-white'
                                            : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700'
                                    } ${availabilityUpdating ? 'cursor-wait opacity-70' : ''}`}
                                >
                                    Busy
                                </button>
                            </div>
                        </div>
                        <p className="max-w-sm text-xs text-gray-500 sm:text-right">
                            {activeAcceptedTrips > 0
                                ? `You still have ${activeAcceptedTrips} active delivery ${activeAcceptedTrips === 1 ? 'trip' : 'trips'}, so you cannot mark yourself ready until it is completed.`
                                : 'Use this switch to tell sellers and admins whether you are ready to receive delivery work.'}
                        </p>
                        <Link href="/">
                            <div className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                                <Image src={assets.logo} alt="logo" className="w-20 sm:w-24" />
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                        { label: 'Pending Jobs', value: pendingAssignments, bg: 'bg-cyan-50' },
                        { label: 'On the Road', value: onTheRoad, bg: 'bg-orange-50' },
                        { label: 'Delivered', value: totalDelivered, bg: 'bg-green-50' },
                        { label: 'Delivery Fees', value: formatCurrency(totalPayout), bg: 'bg-purple-50' },
                    ].map((metric) => (
                        <div key={metric.label} className={`${metric.bg} rounded-xl border border-white p-4 shadow-sm`}>
                            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                            <p className="text-xs text-gray-500">{metric.label}</p>
                        </div>
                    ))}
                </div>

                <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Monthly statement</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Download your delivery earnings and rider subscription summary for any month in your activity history.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                            <select
                                value={statementPeriodKey}
                                onChange={(event) => setStatementPeriodKey(event.target.value)}
                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-400 sm:min-w-[220px]"
                            >
                                {statementPeriodOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => void handleStatementDownload()}
                                disabled={!statementPeriodKey || downloadingStatement}
                                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                                    !statementPeriodKey || downloadingStatement
                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                        : 'bg-gray-900 text-white hover:bg-black'
                                }`}
                            >
                                {downloadingStatement ? 'Preparing...' : 'Download statement'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`rounded-xl px-4 py-2.5 text-sm font-medium transition sm:px-5 ${
                            activeTab === 'active'
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Active ({active.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`rounded-xl px-4 py-2.5 text-sm font-medium transition sm:px-5 ${
                            activeTab === 'completed'
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Completed ({completed.length})
                    </button>
                </div>

                {displayed.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-400">
                        <p className="font-medium">{activeTab === 'active' ? 'No active deliveries' : 'No completed deliveries yet'}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayed.map((delivery) => {
                            const isExpanded = expandedId === delivery._id;

                            return (
                                <div key={delivery._id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                                    <div
                                        className="cursor-pointer p-4 hover:bg-gray-50/50 sm:p-5"
                                        onClick={() => setExpandedId(isExpanded ? null : delivery._id)}
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-semibold text-gray-900 text-sm">
                                                        Order #{String(delivery._id).slice(-8).toUpperCase()}
                                                    </p>
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusBadgeClass(delivery.status)}`}>
                                                        {getOrderStatusDisplay(delivery.status)}
                                                    </span>
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRiderAssignmentBadgeClass(delivery.riderAssignmentStatus, delivery.riderId)}`}>
                                                        {delivery.riderAssignmentStatus}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {delivery.items.length} product lines · {formatCurrency(delivery.amount)} · Delivery fee {formatCurrency(delivery.deliveryPayout || 0)}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Pickup: {delivery.pickup?.location || 'Awaiting seller location'} → Drop-off: {delivery.dropoff?.location || 'Awaiting customer address'}
                                                </p>
                                            </div>
                                            <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="space-y-5 border-t border-gray-100 p-5">
                                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1.15fr_0.9fr]">
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Pickup Details</p>
                                                        <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-gray-700">
                                                            <p className="font-semibold text-gray-900">{delivery.seller?.name || 'Seller'}</p>
                                                            <p>Pickup base: {delivery.pickup?.location || 'Pickup location not available yet'}</p>
                                                            <p>
                                                                {delivery.pickup?.contactUnlocked
                                                                    ? (delivery.pickup?.phoneNumber || 'Phone not available')
                                                                    : 'Unlocks after you accept this delivery'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Items</p>
                                                        <div className="space-y-2">
                                                            {delivery.items.map((item, index) => (
                                                                <div key={index} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                                                    {item.product?.image?.[0] && (
                                                                        <Image
                                                                            src={item.product.image[0]}
                                                                            alt={item.product.name}
                                                                            width={48}
                                                                            height={48}
                                                                            className="h-12 w-12 rounded-lg object-cover"
                                                                        />
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-sm font-medium text-gray-800">{item.product?.name || 'Product'}</p>
                                                                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                                        {item.product?.location && (
                                                                            <p className="text-xs text-gray-400">Item location: {item.product.location}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Drop-off Details</p>
                                                        <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                                                            <p className="font-semibold text-gray-900">{delivery.dropoff?.customerName || 'Customer'}</p>
                                                            <p>{delivery.dropoff?.location || 'No address available yet'}</p>
                                                            <p>
                                                                {delivery.dropoff?.phoneNumber
                                                                    ? delivery.dropoff.phoneNumber
                                                                    : 'Unlocks after you accept this delivery'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Tracking Timeline</p>
                                                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                                            <div className="space-y-4">
                                                                {(delivery.trackingEvents || []).slice().reverse().map((event) => (
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

                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Trip Snapshot</p>
                                                        <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                                                            <p>{new Date(delivery.date).toLocaleDateString()}</p>
                                                            <p className="font-semibold text-gray-800">
                                                                Order total: {formatCurrency(delivery.amount)}
                                                            </p>
                                                            <p className="font-medium text-green-600">
                                                                Delivery fee: {formatCurrency(delivery.deliveryPayout || 0)}
                                                            </p>
                                                            <p>Items to carry: {delivery.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-3">
                                                        {delivery.actions?.canAcceptAssignment && (
                                                            <button
                                                                onClick={() => void updateDelivery(delivery._id, { assignmentResponse: 'ACCEPT' }, 'Delivery accepted')}
                                                                disabled={updatingId === delivery._id}
                                                                className="rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                                                            >
                                                                {updatingId === delivery._id ? 'Saving...' : 'Accept Delivery'}
                                                            </button>
                                                        )}

                                                        {delivery.actions?.canDeclineAssignment && (
                                                            <button
                                                                onClick={() => void updateDelivery(delivery._id, { assignmentResponse: 'DECLINE' }, 'Delivery declined')}
                                                                disabled={updatingId === delivery._id}
                                                                className="rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                                                            >
                                                                {updatingId === delivery._id ? 'Saving...' : 'Decline Delivery'}
                                                            </button>
                                                        )}

                                                        {delivery.actions?.canStartDelivery && (
                                                            <button
                                                                onClick={() => void updateDelivery(delivery._id, { status: 'OUT_FOR_DELIVERY' }, 'Delivery started')}
                                                                disabled={updatingId === delivery._id}
                                                                className="rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
                                                            >
                                                                {updatingId === delivery._id ? 'Saving...' : 'Mark Out for Delivery'}
                                                            </button>
                                                        )}

                                                        {delivery.actions?.canMarkDelivered && (
                                                            <button
                                                                onClick={() => void updateDelivery(delivery._id, { status: 'DELIVERED' }, 'Marked delivered')}
                                                                disabled={updatingId === delivery._id}
                                                                className="rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-wait disabled:opacity-60"
                                                            >
                                                                {updatingId === delivery._id ? 'Saving...' : 'Mark Delivered'}
                                                            </button>
                                                        )}

                                                        {!delivery.actions?.canAcceptAssignment && !delivery.actions?.canDeclineAssignment && !delivery.actions?.canStartDelivery && !delivery.actions?.canMarkDelivered && (
                                                            <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                                                No rider action is needed right now. Keep monitoring this delivery from your dashboard.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

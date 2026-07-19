'use client';
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
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
            <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-4 md:px-6 md:py-5">
                <div className="mx-auto max-w-6xl">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold tracking-tight text-gray-950">Deliveries</h1>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                riderAvailability === 'busy'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {riderAvailability === 'busy' ? 'BUSY' : 'AVAILABLE'}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">Accept jobs, unlock contacts after acceptance, and update delivery progress.</p>
                    </div>
                    <div className="flex flex-col items-start gap-1.5 sm:items-end">
                        <div className="inline-flex rounded-full bg-gray-100 p-1">
                            <button
                                type="button"
                                onClick={() => void updateAvailability('available')}
                                disabled={availabilityUpdating || riderAvailability === 'available'}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                    riderAvailability === 'available'
                                        ? 'bg-white text-emerald-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                } ${availabilityUpdating ? 'cursor-wait opacity-70' : ''}`}
                            >
                                Ready for work
                            </button>
                            <button
                                type="button"
                                onClick={() => void updateAvailability('busy')}
                                disabled={availabilityUpdating || riderAvailability === 'busy'}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                    riderAvailability === 'busy'
                                        ? 'bg-white text-orange-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                } ${availabilityUpdating ? 'cursor-wait opacity-70' : ''}`}
                            >
                                Busy
                            </button>
                        </div>
                        <p className="max-w-sm text-[11px] text-gray-400 sm:text-right">
                            {activeAcceptedTrips > 0
                                ? `You still have ${activeAcceptedTrips} active ${activeAcceptedTrips === 1 ? 'trip' : 'trips'} — finish ${activeAcceptedTrips === 1 ? 'it' : 'them'} before marking yourself ready.`
                                : 'Tell sellers and admins whether you can take delivery work.'}
                        </p>
                    </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                    {[
                        { label: 'Pending Jobs', value: pendingAssignments },
                        { label: 'On the Road', value: onTheRoad },
                        { label: 'Delivered', value: totalDelivered },
                        { label: 'Delivery Fees', value: formatCurrency(totalPayout) },
                    ].map((metric) => (
                        <div key={metric.label} className="rounded-xl bg-white p-3.5 ring-1 ring-gray-100">
                            <p className="truncate text-lg font-bold text-gray-950">{metric.value}</p>
                            <p className="text-[11px] text-gray-500">{metric.label}</p>
                        </div>
                    ))}
                </div>

                <div className="mb-4 rounded-xl bg-white p-4 ring-1 ring-gray-100">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-950">Monthly statement</h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Delivery earnings and subscription summary for any month.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <select
                                value={statementPeriodKey}
                                onChange={(event) => setStatementPeriodKey(event.target.value)}
                                className="w-full cursor-pointer rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700 outline-none sm:min-w-[180px]"
                            >
                                {statementPeriodOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => void handleStatementDownload()}
                                disabled={!statementPeriodKey || downloadingStatement}
                                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                    !statementPeriodKey || downloadingStatement
                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                        : 'bg-gray-950 text-white hover:bg-gray-800'
                                }`}
                            >
                                {downloadingStatement ? 'Preparing...' : 'Download statement'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-4 inline-flex rounded-full bg-gray-100 p-1">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                            activeTab === 'active'
                                ? 'bg-white text-gray-950 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Active ({active.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                            activeTab === 'completed'
                                ? 'bg-white text-gray-950 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Completed ({completed.length})
                    </button>
                </div>

                {displayed.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center rounded-xl bg-white text-gray-400 ring-1 ring-gray-100">
                        <p className="text-sm font-medium">{activeTab === 'active' ? 'No active deliveries' : 'No completed deliveries yet'}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayed.map((delivery) => {
                            const isExpanded = expandedId === delivery._id;

                            return (
                                <div key={delivery._id} className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-100">
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
                                        <div className="space-y-4 border-t border-gray-100 p-3.5 sm:p-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.15fr_1.15fr_0.9fr]">
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Pickup Details</p>
                                                        <div className="space-y-1.5 rounded-lg bg-gray-50/80 p-3 text-xs text-gray-700">
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
                                                                <div key={index} className="flex items-center gap-2.5 rounded-lg bg-gray-50/80 p-2.5">
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
                                                        <div className="space-y-1.5 rounded-lg bg-gray-50/80 p-3 text-xs text-gray-700">
                                                            <p className="font-semibold text-gray-900">{delivery.dropoff?.customerName || 'Customer'}</p>
                                                            <p>{delivery.dropoff?.location || 'No address available yet'}</p>
                                                            <p>
                                                                {delivery.dropoff?.phoneNumber
                                                                    ? delivery.dropoff.phoneNumber
                                                                    : 'Unlocks after you accept this delivery'}
                                                            </p>
                                                            {delivery.dropoff?.deliveryNotes ? (
                                                                <p className="rounded-md bg-white px-2 py-1.5 text-[11px] text-gray-600">
                                                                    <span className="font-semibold text-gray-800">Note:</span> {delivery.dropoff.deliveryNotes}
                                                                </p>
                                                            ) : null}
                                                            {Number.isFinite(delivery.dropoff?.latitude) && Number.isFinite(delivery.dropoff?.longitude) ? (
                                                                <a
                                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${delivery.dropoff.latitude},${delivery.dropoff.longitude}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-black"
                                                                >
                                                                    📍 Navigate to GPS pin
                                                                </a>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Tracking Timeline</p>
                                                        <div className="rounded-lg bg-gray-50/80 p-3">
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
                                                        <div className="space-y-1.5 rounded-lg bg-gray-50/80 p-3 text-xs text-gray-600">
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
                                                                className="rounded-full bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                                                            >
                                                                {updatingId === delivery._id ? 'Saving...' : 'Accept Delivery'}
                                                            </button>
                                                        )}

                                                        {delivery.actions?.canDeclineAssignment && (
                                                            <button
                                                                onClick={() => void updateDelivery(delivery._id, { assignmentResponse: 'DECLINE' }, 'Delivery declined')}
                                                                disabled={updatingId === delivery._id}
                                                                className="rounded-full bg-red-600 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                                                            >
                                                                {updatingId === delivery._id ? 'Saving...' : 'Decline Delivery'}
                                                            </button>
                                                        )}

                                                        {delivery.actions?.canStartDelivery && (
                                                            <button
                                                                onClick={() => void updateDelivery(delivery._id, { status: 'OUT_FOR_DELIVERY' }, 'Delivery started')}
                                                                disabled={updatingId === delivery._id}
                                                                className="rounded-full bg-orange-600 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
                                                            >
                                                                {updatingId === delivery._id ? 'Saving...' : 'Mark Out for Delivery'}
                                                            </button>
                                                        )}

                                                        {delivery.actions?.canMarkDelivered && (
                                                            <button
                                                                onClick={() => void updateDelivery(delivery._id, { status: 'DELIVERED' }, 'Marked delivered')}
                                                                disabled={updatingId === delivery._id}
                                                                className="rounded-full bg-green-600 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-wait disabled:opacity-60"
                                                            >
                                                                {updatingId === delivery._id ? 'Saving...' : 'Mark Delivered'}
                                                            </button>
                                                        )}

                                                        {!delivery.actions?.canAcceptAssignment && !delivery.actions?.canDeclineAssignment && !delivery.actions?.canStartDelivery && !delivery.actions?.canMarkDelivered && (
                                                            <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
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
            </div>
        </>
    );
}

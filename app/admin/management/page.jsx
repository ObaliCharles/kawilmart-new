'use client'

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ClerkAvatarImage from '@/components/ClerkAvatarImage';
import { AdminManagementPageSkeleton } from '@/components/dashboard/DashboardSkeletons';
import { useAppContext } from '@/context/AppContext';

const MANAGEMENT_TABS = {
    seller: {
        key: 'seller',
        label: 'Sellers',
        singular: 'Seller',
        emptyLabel: 'No sellers matched your search.',
        searchPlaceholder: 'Search by store, seller, email, location...',
    },
    rider: {
        key: 'rider',
        label: 'Riders',
        singular: 'Rider',
        emptyLabel: 'No riders matched your search.',
        searchPlaceholder: 'Search by rider, email, location, vehicle...',
    },
};

const badgeToneClasses = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
    slate: 'bg-slate-100 text-slate-700',
};

const subscriptionToneClasses = {
    active: 'bg-emerald-50 text-emerald-700',
    trial: 'bg-sky-50 text-sky-700',
    paused: 'bg-amber-50 text-amber-700',
    overdue: 'bg-red-50 text-red-700',
    cancelled: 'bg-slate-100 text-slate-700',
};

const accountToneClasses = {
    active: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    suspended: 'bg-red-50 text-red-700',
};

const supportPriorityToneClasses = {
    standard: 'bg-slate-100 text-slate-700',
    priority: 'bg-orange-50 text-orange-700',
    vip: 'bg-violet-50 text-violet-700',
};

const availabilityToneClasses = {
    available: 'bg-emerald-50 text-emerald-700',
    busy: 'bg-orange-50 text-orange-700',
};

const emptyManagementDraft = {
    businessName: '',
    businessLocation: '',
    phoneNumber: '',
    businessLicense: '',
    taxId: '',
    governmentIdNumber: '',
    sellerDescription: '',
    sellerSupportEmail: '',
    sellerWhatsappNumber: '',
    sellerLocationCity: '',
    sellerLocationRegion: '',
    sellerLocationCountry: 'Uganda',
    sellerBadgeLabel: '',
    sellerBadgeTone: 'emerald',
    sellerSupportPriority: 'standard',
    accountStatus: 'active',
    legalStatus: 'pending',
    legalNotes: '',
    verificationNotes: '',
    isVerified: false,
    sellerSubscriptionPlan: 'standard',
    sellerSubscriptionStatus: 'active',
    sellerSubscriptionFee: 0,
    sellerSubscriptionLastPaidAt: '',
    sellerSubscriptionNextBillingDate: '',
    sellerAccessUntil: '',
    sellerBillingNotes: '',
    riderBaseLocation: '',
    vehicleType: 'motorcycle',
    licensePlate: '',
    driversLicense: '',
    riderAvailability: 'available',
    riderSubscriptionPlan: 'standard',
    riderSubscriptionStatus: 'active',
    riderSubscriptionFee: 0,
    riderSubscriptionLastPaidAt: '',
    riderSubscriptionNextBillingDate: '',
    riderAccessUntil: '',
    riderBillingNotes: '',
};

const normalizeDateInput = (value) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
};

const getManagementTab = (value) => (value === 'rider' ? 'rider' : 'seller');

const formatDateTime = (value) => {
    if (!value) {
        return 'Not yet';
    }

    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
        return 'Not yet';
    }

    return date.toLocaleString();
};

const getSubscriptionFieldMap = (activeTab) => (
    activeTab === 'seller'
        ? {
            plan: 'sellerSubscriptionPlan',
            status: 'sellerSubscriptionStatus',
            fee: 'sellerSubscriptionFee',
            lastPaidAt: 'sellerSubscriptionLastPaidAt',
            nextBillingDate: 'sellerSubscriptionNextBillingDate',
            accessUntil: 'sellerAccessUntil',
            notes: 'sellerBillingNotes',
        }
        : {
            plan: 'riderSubscriptionPlan',
            status: 'riderSubscriptionStatus',
            fee: 'riderSubscriptionFee',
            lastPaidAt: 'riderSubscriptionLastPaidAt',
            nextBillingDate: 'riderSubscriptionNextBillingDate',
            accessUntil: 'riderAccessUntil',
            notes: 'riderBillingNotes',
        }
);

const buildManagementDraft = (entity = null) => ({
    businessName: entity?.businessName || '',
    businessLocation: entity?.businessLocation || '',
    phoneNumber: entity?.phoneNumber || '',
    businessLicense: entity?.businessLicense || '',
    taxId: entity?.taxId || '',
    governmentIdNumber: entity?.governmentIdNumber || '',
    sellerDescription: entity?.sellerDescription || '',
    sellerSupportEmail: entity?.sellerSupportEmail || '',
    sellerWhatsappNumber: entity?.sellerWhatsappNumber || '',
    sellerLocationCity: entity?.sellerLocationCity || '',
    sellerLocationRegion: entity?.sellerLocationRegion || '',
    sellerLocationCountry: entity?.sellerLocationCountry || 'Uganda',
    sellerBadgeLabel: entity?.sellerBadgeLabel || '',
    sellerBadgeTone: entity?.sellerBadgeTone || 'emerald',
    sellerSupportPriority: entity?.sellerSupportPriority || 'standard',
    accountStatus: entity?.accountStatus || 'active',
    legalStatus: entity?.legalStatus || 'pending',
    legalNotes: entity?.legalNotes || '',
    verificationNotes: entity?.verificationNotes || '',
    isVerified: Boolean(entity?.isVerified),
    sellerSubscriptionPlan: entity?.role === 'seller' ? entity?.subscription?.plan || 'standard' : 'standard',
    sellerSubscriptionStatus: entity?.role === 'seller' ? entity?.subscription?.status || 'active' : 'active',
    sellerSubscriptionFee: entity?.role === 'seller' ? entity?.subscription?.monthlyFee || 0 : 0,
    sellerSubscriptionLastPaidAt: entity?.role === 'seller' ? normalizeDateInput(entity?.subscription?.lastPaidAt) : '',
    sellerSubscriptionNextBillingDate: entity?.role === 'seller' ? normalizeDateInput(entity?.subscription?.nextBillingDate) : '',
    sellerAccessUntil: entity?.role === 'seller' ? normalizeDateInput(entity?.subscription?.accessUntil) : '',
    sellerBillingNotes: entity?.role === 'seller' ? entity?.subscription?.billingNotes || '' : '',
    riderBaseLocation: entity?.riderBaseLocation || '',
    vehicleType: entity?.vehicleType || 'motorcycle',
    licensePlate: entity?.licensePlate || '',
    driversLicense: entity?.driversLicense || '',
    riderAvailability: entity?.riderAvailability || 'available',
    riderSubscriptionPlan: entity?.role === 'rider' ? entity?.subscription?.plan || 'standard' : 'standard',
    riderSubscriptionStatus: entity?.role === 'rider' ? entity?.subscription?.status || 'active' : 'active',
    riderSubscriptionFee: entity?.role === 'rider' ? entity?.subscription?.monthlyFee || 0 : 0,
    riderSubscriptionLastPaidAt: entity?.role === 'rider' ? normalizeDateInput(entity?.subscription?.lastPaidAt) : '',
    riderSubscriptionNextBillingDate: entity?.role === 'rider' ? normalizeDateInput(entity?.subscription?.nextBillingDate) : '',
    riderAccessUntil: entity?.role === 'rider' ? normalizeDateInput(entity?.subscription?.accessUntil) : '',
    riderBillingNotes: entity?.role === 'rider' ? entity?.subscription?.billingNotes || '' : '',
});

const buildUpdatesPayload = (activeTab, draft) => {
    const common = {
        phoneNumber: draft.phoneNumber,
        accountStatus: draft.accountStatus,
        legalStatus: draft.legalStatus,
        legalNotes: draft.legalNotes,
        verificationNotes: draft.verificationNotes,
        governmentIdNumber: draft.governmentIdNumber,
        isVerified: draft.isVerified,
    };

    if (activeTab === 'seller') {
        return {
            ...common,
            businessName: draft.businessName,
            businessLocation: draft.businessLocation,
            businessLicense: draft.businessLicense,
            taxId: draft.taxId,
            sellerDescription: draft.sellerDescription,
            sellerSupportEmail: draft.sellerSupportEmail,
            sellerWhatsappNumber: draft.sellerWhatsappNumber,
            sellerLocationCity: draft.sellerLocationCity,
            sellerLocationRegion: draft.sellerLocationRegion,
            sellerLocationCountry: draft.sellerLocationCountry,
            sellerBadgeLabel: draft.sellerBadgeLabel,
            sellerBadgeTone: draft.sellerBadgeTone,
            sellerSupportPriority: draft.sellerSupportPriority,
            sellerSubscriptionPlan: draft.sellerSubscriptionPlan,
            sellerSubscriptionStatus: draft.sellerSubscriptionStatus,
            sellerSubscriptionFee: Number(draft.sellerSubscriptionFee) || 0,
            sellerSubscriptionLastPaidAt: draft.sellerSubscriptionLastPaidAt,
            sellerSubscriptionNextBillingDate: draft.sellerSubscriptionNextBillingDate,
            sellerAccessUntil: draft.sellerAccessUntil,
            sellerBillingNotes: draft.sellerBillingNotes,
        };
    }

    return {
        ...common,
        riderBaseLocation: draft.riderBaseLocation,
        vehicleType: draft.vehicleType,
        licensePlate: draft.licensePlate,
        driversLicense: draft.driversLicense,
        riderAvailability: draft.riderAvailability,
        riderSubscriptionPlan: draft.riderSubscriptionPlan,
        riderSubscriptionStatus: draft.riderSubscriptionStatus,
        riderSubscriptionFee: Number(draft.riderSubscriptionFee) || 0,
        riderSubscriptionLastPaidAt: draft.riderSubscriptionLastPaidAt,
        riderSubscriptionNextBillingDate: draft.riderSubscriptionNextBillingDate,
        riderAccessUntil: draft.riderAccessUntil,
        riderBillingNotes: draft.riderBillingNotes,
    };
};

const MetricCard = ({ label, value, sub, tone = 'bg-white' }) => (
    <div className={`rounded-2xl border border-gray-200 p-4 shadow-sm ${tone}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
        <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
        {sub ? <p className="mt-1 text-sm text-gray-500">{sub}</p> : null}
    </div>
);

const StatusPill = ({ children, className = '' }) => (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
        {children}
    </span>
);

const Field = ({ label, children, hint }) => (
    <label className="block">
        <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
        {children}
        {hint ? <span className="mt-1 block text-xs text-gray-400">{hint}</span> : null}
    </label>
);

const TabButton = ({ active, onClick, children, badge }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            active
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
        {children}
        {badge ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? 'bg-white/15 text-white' : 'bg-orange-100 text-orange-700'}`}>
                {badge}
            </span>
        ) : null}
    </button>
);

export default function AdminManagement() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { getToken, user, authReady, formatCurrency } = useAppContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(() => getManagementTab(searchParams.get('tab')));
    const [selectedEntityId, setSelectedEntityId] = useState('');
    const [entityDraft, setEntityDraft] = useState(emptyManagementDraft);
    const [saving, setSaving] = useState(false);
    const [supportMessages, setSupportMessages] = useState([]);
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportDraft, setSupportDraft] = useState({ subject: '', content: '' });
    const [sendingSupport, setSendingSupport] = useState(false);

    const handleTabChange = (nextTab) => {
        const resolvedTab = getManagementTab(nextTab);
        setActiveTab(resolvedTab);
        setSearchQuery('');
        setSupportDraft({ subject: '', content: '' });

        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', resolvedTab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const fetchUsers = async (preferredId) => {
        try {
            setLoading(true);
            const token = await getToken();
            const { data } = await axios.get('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!data.success) {
                toast.error(data.message || 'Failed to load management records');
                return;
            }

            setUsers(data.users || []);
            if (preferredId) {
                setSelectedEntityId(preferredId);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load management records');
        } finally {
            setLoading(false);
        }
    };

    const fetchSupportThread = async (participantId) => {
        if (!participantId) {
            setSupportMessages([]);
            return;
        }

        try {
            setSupportLoading(true);
            const token = await getToken();
            const { data } = await axios.get(`/api/support/messages?participantId=${encodeURIComponent(participantId)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                setSupportMessages(data.messages || []);
            } else {
                toast.error(data.message || 'Failed to load support thread');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load support thread');
        } finally {
            setSupportLoading(false);
        }
    };

    useEffect(() => {
        if (!authReady || !user) {
            return;
        }

        void fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, user]);

    useEffect(() => {
        const requestedTab = getManagementTab(searchParams.get('tab'));
        if (requestedTab !== activeTab) {
            setActiveTab(requestedTab);
        }
    }, [activeTab, searchParams]);

    const currentTabConfig = MANAGEMENT_TABS[activeTab];

    const tabEntities = useMemo(() => (
        users.filter((entry) => entry.role === activeTab)
    ), [users, activeTab]);

    const filteredEntities = useMemo(() => {
        const safeQuery = searchQuery.trim().toLowerCase();
        if (!safeQuery) {
            return tabEntities;
        }

        return tabEntities.filter((entry) => {
            const searchableValues = activeTab === 'seller'
                ? [
                    entry.name,
                    entry.email,
                    entry.businessName,
                    entry.businessLocation,
                    entry.sellerLocationCity,
                    entry.sellerLocationRegion,
                ]
                : [
                    entry.name,
                    entry.email,
                    entry.phoneNumber,
                    entry.riderBaseLocation,
                    entry.vehicleType,
                    entry.licensePlate,
                ];

            return searchableValues.some((value) => String(value || '').toLowerCase().includes(safeQuery));
        });
    }, [activeTab, searchQuery, tabEntities]);

    const selectedEntity = filteredEntities.find((entry) => entry.id === selectedEntityId)
        || tabEntities.find((entry) => entry.id === selectedEntityId)
        || filteredEntities[0]
        || tabEntities[0]
        || null;

    useEffect(() => {
        if (!selectedEntity?.id) {
            setSelectedEntityId('');
            setEntityDraft(emptyManagementDraft);
            setSupportMessages([]);
            setSupportDraft({ subject: '', content: '' });
            return;
        }

        if (selectedEntityId !== selectedEntity.id) {
            setSelectedEntityId(selectedEntity.id);
        }

        setEntityDraft(buildManagementDraft(selectedEntity));
        setSupportDraft({ subject: '', content: '' });
        void fetchSupportThread(selectedEntity.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEntity?.id, activeTab]);

    const tabSummary = useMemo(() => ({
        total: tabEntities.length,
        verified: tabEntities.filter((entry) => entry.isVerified).length,
        activeAccess: tabEntities.filter((entry) => entry.access?.hasAccess).length,
        overdue: tabEntities.filter((entry) => entry.subscription?.status === 'overdue').length,
    }), [tabEntities]);

    const updateDraftField = (field, value) => {
        setEntityDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const saveEntity = async (overrides = {}) => {
        if (!selectedEntity) {
            return;
        }

        try {
            setSaving(true);
            const token = await getToken();
            const { data } = await axios.post('/api/admin/update-user', {
                targetUserId: selectedEntity.id,
                updates: {
                    ...buildUpdatesPayload(activeTab, entityDraft),
                    ...overrides,
                },
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!data.success) {
                toast.error(data.message || `Failed to update ${currentTabConfig.singular.toLowerCase()}`);
                return;
            }

            toast.success(`${currentTabConfig.singular} updated`);
            await fetchUsers(selectedEntity.id);
        } catch (error) {
            toast.error(error.message || `Failed to update ${currentTabConfig.singular.toLowerCase()}`);
        } finally {
            setSaving(false);
        }
    };

    const activateThirtyDays = async () => {
        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const fieldMap = getSubscriptionFieldMap(activeTab);

        await saveEntity({
            [fieldMap.status]: 'active',
            [fieldMap.lastPaidAt]: now.toISOString().slice(0, 10),
            [fieldMap.nextBillingDate]: nextMonth.toISOString().slice(0, 10),
            [fieldMap.accessUntil]: nextMonth.toISOString().slice(0, 10),
        });
    };

    const sendSupportMessage = async () => {
        if (!selectedEntity || !supportDraft.content.trim()) {
            return;
        }

        try {
            setSendingSupport(true);
            const token = await getToken();
            const { data } = await axios.post('/api/support/messages', {
                to: selectedEntity.id,
                subject: supportDraft.subject,
                content: supportDraft.content,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!data.success) {
                toast.error(data.message || 'Failed to send support reply');
                return;
            }

            toast.success('Support reply sent');
            setSupportDraft({ subject: '', content: '' });
            await Promise.all([
                fetchSupportThread(selectedEntity.id),
                fetchUsers(selectedEntity.id),
            ]);
        } catch (error) {
            toast.error(error.message || 'Failed to send support reply');
        } finally {
            setSendingSupport(false);
        }
    };

    const profileMetrics = useMemo(() => {
        if (!selectedEntity) {
            return [];
        }

        if (activeTab === 'seller') {
            return [
                {
                    label: 'Products',
                    value: selectedEntity.sellerMetrics?.productCount || 0,
                    sub: 'Active listings owned',
                },
                {
                    label: 'Completed Orders',
                    value: selectedEntity.sellerMetrics?.completedOrders || 0,
                    sub: `${selectedEntity.sellerMetrics?.orderCount || 0} total orders`,
                },
                {
                    label: 'Completed Revenue',
                    value: formatCurrency(selectedEntity.sellerMetrics?.completedRevenue || 0),
                    sub: `Invoice ${selectedEntity.billing?.invoiceNumber || 'pending'}`,
                },
                {
                    label: 'Current Due',
                    value: formatCurrency(selectedEntity.billing?.totalDue || 0),
                    sub: selectedEntity.access?.reason || 'Access is active',
                },
            ];
        }

        return [
            {
                label: 'Assigned Deliveries',
                value: selectedEntity.riderMetrics?.assignedDeliveries || 0,
                sub: 'All assigned jobs',
            },
            {
                label: 'Completed Deliveries',
                value: selectedEntity.riderMetrics?.completedDeliveries || 0,
                sub: `${selectedEntity.riderMetrics?.activeDeliveries || 0} active right now`,
            },
            {
                label: 'Delivery Payout',
                value: formatCurrency(selectedEntity.riderMetrics?.payoutTotal || 0),
                sub: `Invoice ${selectedEntity.billing?.invoiceNumber || 'pending'}`,
            },
            {
                label: 'Current Due',
                value: formatCurrency(selectedEntity.billing?.totalDue || 0),
                sub: selectedEntity.access?.reason || 'Access is active',
            },
        ];
    }, [activeTab, formatCurrency, selectedEntity]);

    if (loading) {
        return <AdminManagementPageSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Operations Management</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Switch between seller and rider operations to manage profiles, verification, subscriptions, access, and support threads.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <TabButton
                        active={activeTab === 'seller'}
                        onClick={() => handleTabChange('seller')}
                        badge={users.filter((entry) => entry.role === 'seller').length || undefined}
                    >
                        Sellers
                    </TabButton>
                    <TabButton
                        active={activeTab === 'rider'}
                        onClick={() => handleTabChange('rider')}
                        badge={users.filter((entry) => entry.role === 'rider').length || undefined}
                    >
                        Riders
                    </TabButton>
                    <button
                        type="button"
                        onClick={() => fetchUsers(selectedEntity?.id || '')}
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label={currentTabConfig.label} value={tabSummary.total} sub="Managed accounts" />
                <MetricCard label="Verified" value={tabSummary.verified} sub="Approved accounts" tone="bg-emerald-50" />
                <MetricCard label="Access Active" value={tabSummary.activeAccess} sub="Can operate right now" tone="bg-sky-50" />
                <MetricCard label="Overdue" value={tabSummary.overdue} sub="Needs billing follow-up" tone="bg-red-50" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="space-y-4">
                    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-gray-700">Find a {currentTabConfig.singular.toLowerCase()}</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder={currentTabConfig.searchPlaceholder}
                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                            />
                        </label>
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-white p-3 shadow-sm">
                        <div className="max-h-[72vh] space-y-2 overflow-y-auto pr-1">
                            {filteredEntities.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                                    {currentTabConfig.emptyLabel}
                                </div>
                            ) : filteredEntities.map((entry) => {
                                const title = activeTab === 'seller'
                                    ? (entry.businessName || entry.name)
                                    : entry.name;
                                const secondary = activeTab === 'seller'
                                    ? (entry.businessLocation || entry.sellerLocationCity || 'Location pending')
                                    : (entry.riderBaseLocation || entry.phoneNumber || 'Base location not set');
                                const tertiary = activeTab === 'seller'
                                    ? entry.email
                                    : [entry.vehicleType || 'Vehicle pending', entry.licensePlate || 'No plate'].join(' · ');

                                return (
                                    <button
                                        key={entry.id}
                                        type="button"
                                        onClick={() => setSelectedEntityId(entry.id)}
                                        className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                                            entry.id === selectedEntity?.id
                                                ? 'border-orange-300 bg-orange-50 shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <ClerkAvatarImage
                                                src={entry.imageUrl}
                                                alt={title}
                                                className="h-12 w-12 rounded-2xl"
                                                fallback={(title || '?').charAt(0)}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
                                                    {activeTab === 'seller' && entry.sellerBadgeLabel ? (
                                                        <StatusPill className={badgeToneClasses[entry.sellerBadgeTone] || badgeToneClasses.emerald}>
                                                            {entry.sellerBadgeLabel}
                                                        </StatusPill>
                                                    ) : null}
                                                </div>
                                                <p className="truncate text-xs text-gray-500">{tertiary}</p>
                                                <p className="mt-1 truncate text-xs text-gray-400">{secondary}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {activeTab === 'rider' ? (
                                                        <StatusPill className={availabilityToneClasses[entry.riderAvailability] || availabilityToneClasses.available}>
                                                            {entry.riderAvailability || 'available'}
                                                        </StatusPill>
                                                    ) : null}
                                                    <StatusPill className={subscriptionToneClasses[entry.subscription?.status] || subscriptionToneClasses.active}>
                                                        {entry.subscription?.status || 'active'}
                                                    </StatusPill>
                                                    <StatusPill className={entry.access?.hasAccess ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}>
                                                        {entry.access?.hasAccess ? 'Access on' : 'Access off'}
                                                    </StatusPill>
                                                    {entry.supportSummary?.unreadCount ? (
                                                        <StatusPill className="bg-orange-100 text-orange-700">
                                                            {entry.supportSummary.unreadCount} new support
                                                        </StatusPill>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                <section className="space-y-6">
                    {!selectedEntity ? (
                        <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-gray-500 shadow-sm">
                            Select a {currentTabConfig.singular.toLowerCase()} to manage their account.
                        </div>
                    ) : (
                        <>
                            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="flex items-start gap-4">
                                        <ClerkAvatarImage
                                            src={selectedEntity.imageUrl}
                                            alt={activeTab === 'seller' ? (selectedEntity.businessName || selectedEntity.name) : selectedEntity.name}
                                            className="h-16 w-16 rounded-3xl"
                                            fallback={(activeTab === 'seller' ? (selectedEntity.businessName || selectedEntity.name) : selectedEntity.name || '?').charAt(0)}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-xl font-semibold text-gray-900">
                                                    {activeTab === 'seller' ? (selectedEntity.businessName || selectedEntity.name) : selectedEntity.name}
                                                </h2>
                                                {activeTab === 'seller' && selectedEntity.sellerBadgeLabel ? (
                                                    <StatusPill className={badgeToneClasses[selectedEntity.sellerBadgeTone] || badgeToneClasses.emerald}>
                                                        {selectedEntity.sellerBadgeLabel}
                                                    </StatusPill>
                                                ) : null}
                                                {activeTab === 'rider' ? (
                                                    <StatusPill className={availabilityToneClasses[selectedEntity.riderAvailability] || availabilityToneClasses.available}>
                                                        {selectedEntity.riderAvailability || 'available'}
                                                    </StatusPill>
                                                ) : null}
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">{selectedEntity.email}</p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {activeTab === 'seller'
                                                    ? (selectedEntity.businessLocation || 'Business location not set')
                                                    : (selectedEntity.riderBaseLocation || 'Base location not set')}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <StatusPill className={accountToneClasses[selectedEntity.accountStatus] || accountToneClasses.active}>
                                                    Account {selectedEntity.accountStatus}
                                                </StatusPill>
                                                <StatusPill className={subscriptionToneClasses[selectedEntity.subscription?.status] || subscriptionToneClasses.active}>
                                                    {selectedEntity.subscription?.status || 'active'} subscription
                                                </StatusPill>
                                                <StatusPill className={selectedEntity.access?.hasAccess ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}>
                                                    {selectedEntity.access?.hasAccess ? 'Operations enabled' : 'Operations disabled'}
                                                </StatusPill>
                                                {activeTab === 'seller' ? (
                                                    <StatusPill className={supportPriorityToneClasses[selectedEntity.sellerSupportPriority] || supportPriorityToneClasses.standard}>
                                                        {selectedEntity.sellerSupportPriority || 'standard'} support
                                                    </StatusPill>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => saveEntity({ isVerified: !selectedEntity.isVerified })}
                                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                                selectedEntity.isVerified
                                                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                            }`}
                                        >
                                            {selectedEntity.isVerified ? 'Remove verification' : `Verify ${currentTabConfig.singular.toLowerCase()}`}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={activateThirtyDays}
                                            className="rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                                        >
                                            Grant 30-day access
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const fieldMap = getSubscriptionFieldMap(activeTab);
                                                void saveEntity({ [fieldMap.status]: 'paused' });
                                            }}
                                            className="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                                        >
                                            Pause access
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const fieldMap = getSubscriptionFieldMap(activeTab);
                                                void saveEntity({ [fieldMap.status]: 'overdue' });
                                            }}
                                            className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                                        >
                                            Mark overdue
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    {profileMetrics.map((metric) => (
                                        <MetricCard
                                            key={metric.label}
                                            label={metric.label}
                                            value={metric.value}
                                            sub={metric.sub}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
                                <div className="space-y-6">
                                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {activeTab === 'seller' ? 'Seller Profile' : 'Rider Profile'}
                                                </h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {activeTab === 'seller'
                                                        ? 'Manage the public storefront identity, legal review, verification notes, and contact details.'
                                                        : 'Manage rider details, delivery identity, legal review, and availability information.'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => saveEntity()}
                                                disabled={saving}
                                                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                                    saving
                                                        ? 'cursor-wait bg-gray-100 text-gray-400'
                                                        : 'bg-gray-900 text-white hover:bg-black'
                                                }`}
                                            >
                                                {saving ? 'Saving...' : 'Save changes'}
                                            </button>
                                        </div>

                                        {activeTab === 'seller' ? (
                                            <>
                                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                                    <Field label="Business name">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.businessName}
                                                            onChange={(event) => updateDraftField('businessName', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Business location">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.businessLocation}
                                                            onChange={(event) => updateDraftField('businessLocation', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="City">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.sellerLocationCity}
                                                            onChange={(event) => updateDraftField('sellerLocationCity', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Region / District">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.sellerLocationRegion}
                                                            onChange={(event) => updateDraftField('sellerLocationRegion', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Country">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.sellerLocationCountry}
                                                            onChange={(event) => updateDraftField('sellerLocationCountry', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Phone number">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.phoneNumber}
                                                            onChange={(event) => updateDraftField('phoneNumber', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Support email">
                                                        <input
                                                            type="email"
                                                            value={entityDraft.sellerSupportEmail}
                                                            onChange={(event) => updateDraftField('sellerSupportEmail', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="WhatsApp / support line">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.sellerWhatsappNumber}
                                                            onChange={(event) => updateDraftField('sellerWhatsappNumber', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Business license">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.businessLicense}
                                                            onChange={(event) => updateDraftField('businessLicense', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Tax ID">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.taxId}
                                                            onChange={(event) => updateDraftField('taxId', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Account status">
                                                        <select
                                                            value={entityDraft.accountStatus}
                                                            onChange={(event) => updateDraftField('accountStatus', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        >
                                                            <option value="active">Active</option>
                                                            <option value="pending">Pending</option>
                                                            <option value="suspended">Suspended</option>
                                                        </select>
                                                    </Field>
                                                    <Field label="Legal status">
                                                        <select
                                                            value={entityDraft.legalStatus}
                                                            onChange={(event) => updateDraftField('legalStatus', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="approved">Approved</option>
                                                            <option value="flagged">Flagged</option>
                                                        </select>
                                                    </Field>
                                                    <Field label="Seller badge label" hint="Leave blank if you do not want a public badge.">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.sellerBadgeLabel}
                                                            onChange={(event) => updateDraftField('sellerBadgeLabel', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Badge tone">
                                                        <select
                                                            value={entityDraft.sellerBadgeTone}
                                                            onChange={(event) => updateDraftField('sellerBadgeTone', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        >
                                                            <option value="emerald">Emerald</option>
                                                            <option value="sky">Sky</option>
                                                            <option value="amber">Amber</option>
                                                            <option value="violet">Violet</option>
                                                            <option value="slate">Slate</option>
                                                        </select>
                                                    </Field>
                                                    <Field label="Support priority">
                                                        <select
                                                            value={entityDraft.sellerSupportPriority}
                                                            onChange={(event) => updateDraftField('sellerSupportPriority', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        >
                                                            <option value="standard">Standard</option>
                                                            <option value="priority">Priority</option>
                                                            <option value="vip">VIP</option>
                                                        </select>
                                                    </Field>
                                                </div>

                                                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                                                    <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={entityDraft.isVerified}
                                                            onChange={(event) => updateDraftField('isVerified', event.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                        />
                                                        Verified seller badge enabled
                                                    </label>
                                                </div>

                                                <div className="mt-4 grid gap-4">
                                                    <Field label="Store description">
                                                        <textarea
                                                            value={entityDraft.sellerDescription}
                                                            onChange={(event) => updateDraftField('sellerDescription', event.target.value)}
                                                            className="h-28 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Legal notes">
                                                        <textarea
                                                            value={entityDraft.legalNotes}
                                                            onChange={(event) => updateDraftField('legalNotes', event.target.value)}
                                                            className="h-24 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Verification notes">
                                                        <textarea
                                                            value={entityDraft.verificationNotes}
                                                            onChange={(event) => updateDraftField('verificationNotes', event.target.value)}
                                                            className="h-24 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                                    <Field label="Phone number">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.phoneNumber}
                                                            onChange={(event) => updateDraftField('phoneNumber', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Base location">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.riderBaseLocation}
                                                            onChange={(event) => updateDraftField('riderBaseLocation', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Vehicle type">
                                                        <select
                                                            value={entityDraft.vehicleType}
                                                            onChange={(event) => updateDraftField('vehicleType', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        >
                                                            <option value="motorcycle">Motorcycle</option>
                                                            <option value="bicycle">Bicycle</option>
                                                            <option value="car">Car</option>
                                                        </select>
                                                    </Field>
                                                    <Field label="Rider availability">
                                                        <select
                                                            value={entityDraft.riderAvailability}
                                                            onChange={(event) => updateDraftField('riderAvailability', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        >
                                                            <option value="available">Available</option>
                                                            <option value="busy">Busy</option>
                                                        </select>
                                                    </Field>
                                                    <Field label="License plate">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.licensePlate}
                                                            onChange={(event) => updateDraftField('licensePlate', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Driver's license">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.driversLicense}
                                                            onChange={(event) => updateDraftField('driversLicense', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Government ID number">
                                                        <input
                                                            type="text"
                                                            value={entityDraft.governmentIdNumber}
                                                            onChange={(event) => updateDraftField('governmentIdNumber', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Account status">
                                                        <select
                                                            value={entityDraft.accountStatus}
                                                            onChange={(event) => updateDraftField('accountStatus', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        >
                                                            <option value="active">Active</option>
                                                            <option value="pending">Pending</option>
                                                            <option value="suspended">Suspended</option>
                                                        </select>
                                                    </Field>
                                                    <Field label="Legal status">
                                                        <select
                                                            value={entityDraft.legalStatus}
                                                            onChange={(event) => updateDraftField('legalStatus', event.target.value)}
                                                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="approved">Approved</option>
                                                            <option value="flagged">Flagged</option>
                                                        </select>
                                                    </Field>
                                                </div>

                                                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                                                    <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={entityDraft.isVerified}
                                                            onChange={(event) => updateDraftField('isVerified', event.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                        />
                                                        Verified rider account
                                                    </label>
                                                </div>

                                                <div className="mt-4 grid gap-4">
                                                    <Field label="Legal notes">
                                                        <textarea
                                                            value={entityDraft.legalNotes}
                                                            onChange={(event) => updateDraftField('legalNotes', event.target.value)}
                                                            className="h-24 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                    <Field label="Verification notes">
                                                        <textarea
                                                            value={entityDraft.verificationNotes}
                                                            onChange={(event) => updateDraftField('verificationNotes', event.target.value)}
                                                            className="h-24 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                        />
                                                    </Field>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-900">Subscription & Access</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Control billing, access windows, and monthly operations for this {currentTabConfig.singular.toLowerCase()}.
                                        </p>

                                        {(() => {
                                            const fieldMap = getSubscriptionFieldMap(activeTab);
                                            return (
                                                <>
                                                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                                                        <Field label="Subscription plan">
                                                            <select
                                                                value={entityDraft[fieldMap.plan]}
                                                                onChange={(event) => updateDraftField(fieldMap.plan, event.target.value)}
                                                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                            >
                                                                <option value="standard">Standard</option>
                                                                <option value="growth">Growth</option>
                                                                <option value="premium">Premium</option>
                                                                {activeTab === 'seller' ? <option value="enterprise">Enterprise</option> : null}
                                                            </select>
                                                        </Field>
                                                        <Field label="Subscription status">
                                                            <select
                                                                value={entityDraft[fieldMap.status]}
                                                                onChange={(event) => updateDraftField(fieldMap.status, event.target.value)}
                                                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                            >
                                                                <option value="active">Active</option>
                                                                <option value="trial">Trial</option>
                                                                <option value="paused">Paused</option>
                                                                <option value="overdue">Overdue</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>
                                                        </Field>
                                                        <Field label="Monthly fee">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={entityDraft[fieldMap.fee]}
                                                                onChange={(event) => updateDraftField(fieldMap.fee, event.target.value)}
                                                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                            />
                                                        </Field>
                                                        <Field label="Last payment date">
                                                            <input
                                                                type="date"
                                                                value={entityDraft[fieldMap.lastPaidAt]}
                                                                onChange={(event) => updateDraftField(fieldMap.lastPaidAt, event.target.value)}
                                                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                            />
                                                        </Field>
                                                        <Field label="Next billing date">
                                                            <input
                                                                type="date"
                                                                value={entityDraft[fieldMap.nextBillingDate]}
                                                                onChange={(event) => updateDraftField(fieldMap.nextBillingDate, event.target.value)}
                                                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                            />
                                                        </Field>
                                                        <Field label="Access valid until">
                                                            <input
                                                                type="date"
                                                                value={entityDraft[fieldMap.accessUntil]}
                                                                onChange={(event) => updateDraftField(fieldMap.accessUntil, event.target.value)}
                                                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                            />
                                                        </Field>
                                                    </div>

                                                    <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <StatusPill className={subscriptionToneClasses[selectedEntity.subscription?.status] || subscriptionToneClasses.active}>
                                                                {selectedEntity.subscription?.status || 'active'}
                                                            </StatusPill>
                                                            <StatusPill className={selectedEntity.access?.hasAccess ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}>
                                                                {selectedEntity.access?.hasAccess ? 'Operations enabled' : 'Operations disabled'}
                                                            </StatusPill>
                                                            {activeTab === 'rider' ? (
                                                                <StatusPill className={availabilityToneClasses[selectedEntity.riderAvailability] || availabilityToneClasses.available}>
                                                                    {selectedEntity.riderAvailability || 'available'}
                                                                </StatusPill>
                                                            ) : null}
                                                        </div>
                                                        <p className="mt-3 text-sm text-gray-600">
                                                            {selectedEntity.access?.reason || `${currentTabConfig.singular} access is active.`}
                                                        </p>
                                                        <p className="mt-2 text-xs text-gray-400">
                                                            Last paid: {formatDateTime(selectedEntity.subscription?.lastPaidAt)} ·
                                                            Next billing: {formatDateTime(selectedEntity.subscription?.nextBillingDate)} ·
                                                            Access until: {formatDateTime(selectedEntity.subscription?.accessUntil)}
                                                        </p>
                                                    </div>

                                                    <div className="mt-4">
                                                        <Field label="Billing notes">
                                                            <textarea
                                                                value={entityDraft[fieldMap.notes]}
                                                                onChange={(event) => updateDraftField(fieldMap.notes, event.target.value)}
                                                                className="h-28 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                                            />
                                                        </Field>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-900">Operational Snapshot</h3>
                                        <div className="mt-5 space-y-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Support unread</span>
                                                <span className="font-semibold text-gray-900">{selectedEntity.supportSummary?.unreadCount || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Latest support update</span>
                                                <span className="font-semibold text-gray-900">
                                                    {selectedEntity.supportSummary?.lastMessageAt
                                                        ? new Date(selectedEntity.supportSummary.lastMessageAt).toLocaleDateString()
                                                        : 'No messages yet'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Invoice number</span>
                                                <span className="font-semibold text-gray-900">{selectedEntity.billing?.invoiceNumber || 'Pending'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Monthly fee</span>
                                                <span className="font-semibold text-gray-900">{formatCurrency(selectedEntity.subscription?.monthlyFee || 0)}</span>
                                            </div>
                                            {activeTab === 'seller' ? (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Commission due</span>
                                                    <span className="font-semibold text-gray-900">{formatCurrency(selectedEntity.billing?.commissionTotal || 0)}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Payout total</span>
                                                    <span className="font-semibold text-gray-900">{formatCurrency(selectedEntity.riderMetrics?.payoutTotal || 0)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">Support Chat</h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Reply to {currentTabConfig.singular.toLowerCase()} support questions from the admin dashboard.
                                                </p>
                                            </div>
                                            {selectedEntity.supportSummary?.unreadCount ? (
                                                <StatusPill className="bg-orange-100 text-orange-700">
                                                    {selectedEntity.supportSummary.unreadCount} unread
                                                </StatusPill>
                                            ) : null}
                                        </div>

                                        <div className="mt-5 h-[340px] overflow-y-auto rounded-3xl bg-gray-50 p-4">
                                            {supportLoading ? (
                                                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                                    Loading support conversation...
                                                </div>
                                            ) : supportMessages.length === 0 ? (
                                                <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">
                                                    No support conversation yet. Start one below.
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {supportMessages.map((message) => (
                                                        <div
                                                            key={message._id || message.messageId}
                                                            className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div
                                                                className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                                                                    message.isOwnMessage
                                                                        ? 'bg-gray-900 text-white'
                                                                        : 'bg-white text-gray-700'
                                                                }`}
                                                            >
                                                                {message.subject ? (
                                                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                                                        message.isOwnMessage ? 'text-white/70' : 'text-gray-400'
                                                                    }`}>
                                                                        {message.subject}
                                                                    </p>
                                                                ) : null}
                                                                <p className="mt-1 whitespace-pre-wrap leading-6">{message.content}</p>
                                                                <p className={`mt-2 text-[11px] ${
                                                                    message.isOwnMessage ? 'text-white/60' : 'text-gray-400'
                                                                }`}>
                                                                    {message.senderLabel || (message.isOwnMessage ? 'You' : selectedEntity.name)} · {formatDateTime(message.date)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            <input
                                                type="text"
                                                value={supportDraft.subject}
                                                onChange={(event) => setSupportDraft((current) => ({ ...current, subject: event.target.value }))}
                                                placeholder={`Subject, for example: ${activeTab === 'seller' ? 'Subscription approved' : 'Delivery account update'}`}
                                                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                            />
                                            <textarea
                                                value={supportDraft.content}
                                                onChange={(event) => setSupportDraft((current) => ({ ...current, content: event.target.value }))}
                                                placeholder={`Reply to this ${currentTabConfig.singular.toLowerCase()} here...`}
                                                className="h-32 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={sendSupportMessage}
                                                disabled={sendingSupport || !supportDraft.content.trim()}
                                                className={`w-full rounded-full px-4 py-3 text-sm font-medium transition ${
                                                    sendingSupport || !supportDraft.content.trim()
                                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                        : 'bg-orange-600 text-white hover:bg-orange-700'
                                                }`}
                                            >
                                                {sendingSupport ? 'Sending...' : 'Send support reply'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

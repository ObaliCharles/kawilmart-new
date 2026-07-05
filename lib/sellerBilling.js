import {
    COMMISSION_STATUSES,
    DEFAULT_COMMISSION_RATE,
    ORDER_STATUSES,
    calculateCommission,
    getCurrentBillingPeriod,
    getInvoiceNumber,
    normalizeOrderStatus,
} from "@/lib/orderLifecycle";

const DAY_MS = 86400000;

export const SELLER_SUBSCRIPTION_PLANS = ["standard", "growth", "premium", "enterprise"];
export const SELLER_SUBSCRIPTION_STATUSES = ["active", "paused", "overdue", "trial", "cancelled"];
export const RIDER_SUBSCRIPTION_PLANS = ["standard", "growth", "premium"];
export const RIDER_SUBSCRIPTION_STATUSES = ["active", "paused", "overdue", "trial", "cancelled"];

export const DEFAULT_SELLER_SUBSCRIPTION = {
    plan: "standard",
    status: "active",
    monthlyFee: 0,
    lastPaidAt: null,
    nextBillingDate: null,
    accessUntil: null,
    supportPriority: "standard",
};

export const DEFAULT_RIDER_SUBSCRIPTION = {
    plan: "standard",
    status: "active",
    monthlyFee: 0,
    lastPaidAt: null,
    nextBillingDate: null,
    accessUntil: null,
};

const normalizeDate = (value) => {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
};

const toIsoOrNull = (value) => {
    const date = normalizeDate(value);
    return date ? date.toISOString() : null;
};

const getWholeDaysRemaining = (date, now) => {
    if (!date) {
        return null;
    }

    return Math.ceil((date.getTime() - now.getTime()) / DAY_MS);
};

const buildAccessState = ({
    subscription,
    now = new Date(),
    activeStatuses = ["active", "trial"],
    labels = {
        active: "Account is active.",
        paused: "Subscription is paused.",
        overdue: "Subscription payment is overdue.",
        cancelled: "Subscription has been cancelled.",
        expired: "Access window has expired.",
        trial: "Account is currently on trial access.",
    },
} = {}) => {
    const accessUntilDate = normalizeDate(subscription?.accessUntil);
    const nextBillingDate = normalizeDate(subscription?.nextBillingDate);
    const hasStatusAccess = activeStatuses.includes(subscription?.status);
    const withinAccessWindow = !accessUntilDate || accessUntilDate.getTime() >= now.getTime();
    const hasAccess = hasStatusAccess && withinAccessWindow;
    const daysRemaining = getWholeDaysRemaining(accessUntilDate, now);
    const billingWindowDays = getWholeDaysRemaining(nextBillingDate, now);

    let reason = labels.active;
    if (subscription?.status === "paused") {
        reason = labels.paused;
    } else if (subscription?.status === "overdue") {
        reason = labels.overdue;
    } else if (subscription?.status === "cancelled") {
        reason = labels.cancelled;
    } else if (accessUntilDate && accessUntilDate.getTime() < now.getTime()) {
        reason = labels.expired;
    } else if (subscription?.status === "trial") {
        reason = labels.trial;
    }

    return {
        hasAccess,
        status: subscription?.status || "active",
        reason,
        daysRemaining,
        isExpired: Boolean(accessUntilDate && accessUntilDate.getTime() < now.getTime()),
        isExpiringSoon: typeof daysRemaining === "number" && daysRemaining >= 0 && daysRemaining <= 5,
        isBillingDueSoon: typeof billingWindowDays === "number" && billingWindowDays >= 0 && billingWindowDays <= 5,
        lastPaidAt: subscription?.lastPaidAt || null,
        nextBillingDate: subscription?.nextBillingDate || null,
        accessUntil: subscription?.accessUntil || null,
    };
};

export const getSellerSubscriptionSnapshot = (seller = {}) => ({
    plan: SELLER_SUBSCRIPTION_PLANS.includes(seller?.sellerSubscriptionPlan)
        ? seller.sellerSubscriptionPlan
        : DEFAULT_SELLER_SUBSCRIPTION.plan,
    status: SELLER_SUBSCRIPTION_STATUSES.includes(seller?.sellerSubscriptionStatus)
        ? seller.sellerSubscriptionStatus
        : DEFAULT_SELLER_SUBSCRIPTION.status,
    monthlyFee: Math.max(0, Number(seller?.sellerSubscriptionFee) || DEFAULT_SELLER_SUBSCRIPTION.monthlyFee),
    lastPaidAt: toIsoOrNull(seller?.sellerSubscriptionLastPaidAt),
    nextBillingDate: toIsoOrNull(seller?.sellerSubscriptionNextBillingDate),
    accessUntil: toIsoOrNull(seller?.sellerAccessUntil),
    startedAt: toIsoOrNull(seller?.sellerSubscriptionStartedAt),
    billingNotes: seller?.sellerBillingNotes || "",
    supportPriority: seller?.sellerSupportPriority || DEFAULT_SELLER_SUBSCRIPTION.supportPriority,
});

export const getSellerAccessState = (seller = {}, { now = new Date() } = {}) => {
    const subscription = getSellerSubscriptionSnapshot(seller);
    return buildAccessState({
        subscription,
        now,
        labels: {
            active: "Seller account is active.",
            paused: "Seller subscription is paused.",
            overdue: "Seller subscription payment is overdue.",
            cancelled: "Seller subscription has been cancelled.",
            expired: "Seller access window has expired.",
            trial: "Seller is currently on trial access.",
        },
    });
};

export const getRiderSubscriptionSnapshot = (rider = {}) => ({
    plan: RIDER_SUBSCRIPTION_PLANS.includes(rider?.riderSubscriptionPlan)
        ? rider.riderSubscriptionPlan
        : DEFAULT_RIDER_SUBSCRIPTION.plan,
    status: RIDER_SUBSCRIPTION_STATUSES.includes(rider?.riderSubscriptionStatus)
        ? rider.riderSubscriptionStatus
        : DEFAULT_RIDER_SUBSCRIPTION.status,
    monthlyFee: Math.max(0, Number(rider?.riderSubscriptionFee) || DEFAULT_RIDER_SUBSCRIPTION.monthlyFee),
    lastPaidAt: toIsoOrNull(rider?.riderSubscriptionLastPaidAt),
    nextBillingDate: toIsoOrNull(rider?.riderSubscriptionNextBillingDate),
    accessUntil: toIsoOrNull(rider?.riderAccessUntil),
    startedAt: toIsoOrNull(rider?.riderSubscriptionStartedAt),
    billingNotes: rider?.riderBillingNotes || "",
});

export const getRiderAccessState = (rider = {}, { now = new Date() } = {}) => {
    const subscription = getRiderSubscriptionSnapshot(rider);
    return buildAccessState({
        subscription,
        now,
        labels: {
            active: "Rider account is active.",
            paused: "Rider subscription is paused.",
            overdue: "Rider subscription payment is overdue.",
            cancelled: "Rider subscription has been cancelled.",
            expired: "Rider access window has expired.",
            trial: "Rider is currently on trial access.",
        },
    });
};

export const getCompletedSellerOrders = (orders = []) => (
    orders.filter((order) => normalizeOrderStatus(order?.status) === ORDER_STATUSES.COMPLETED)
);

export const getCompletedSellerOrdersForPeriod = (orders = [], period = null) => {
    const completedOrders = getCompletedSellerOrders(orders);

    if (!period?.start || !period?.end) {
        return completedOrders;
    }

    const periodStart = new Date(period.start).getTime();
    const periodEnd = new Date(period.end).getTime();

    return completedOrders.filter((order) => {
        const completionDate = order?.customerConfirmedAt || order?.date;
        const timestamp = new Date(completionDate).getTime();
        return Number.isFinite(timestamp) && timestamp >= periodStart && timestamp <= periodEnd;
    });
};

export const getCompletedRiderDeliveriesForPeriod = (orders = [], period = null) => {
    if (!period?.start || !period?.end) {
        return orders.filter((order) => {
            const status = normalizeOrderStatus(order?.status);
            return status === ORDER_STATUSES.DELIVERED || status === ORDER_STATUSES.COMPLETED;
        });
    }

    const periodStart = new Date(period.start).getTime();
    const periodEnd = new Date(period.end).getTime();

    return orders.filter((order) => {
        const deliveryDate = order?.deliveredAt || order?.customerConfirmedAt || order?.date;
        const timestamp = new Date(deliveryDate).getTime();
        const status = normalizeOrderStatus(order?.status);
        return Number.isFinite(timestamp)
            && timestamp >= periodStart
            && timestamp <= periodEnd
            && (status === ORDER_STATUSES.DELIVERED || status === ORDER_STATUSES.COMPLETED);
    });
};

export const buildSellerInvoiceSnapshot = ({
    seller = {},
    orders = [],
    now = new Date(),
    commissionRate = DEFAULT_COMMISSION_RATE,
    period = null,
} = {}) => {
    const resolvedPeriod = period || getCurrentBillingPeriod(now);
    const subscription = getSellerSubscriptionSnapshot(seller);
    const access = getSellerAccessState(seller, { now });
    const periodCompletedOrders = getCompletedSellerOrdersForPeriod(orders, resolvedPeriod);

    const completedSubtotal = periodCompletedOrders.reduce((sum, order) => sum + (Number(order?.subtotal) || 0), 0);
    const commissionTotal = periodCompletedOrders.reduce((sum, order) => {
        const storedCommission = Number(order?.commissionAmount);
        return sum + (Number.isFinite(storedCommission) ? storedCommission : calculateCommission(order?.subtotal, commissionRate));
    }, 0);

    const orderCount = periodCompletedOrders.length;
    const totalDue = subscription.monthlyFee + commissionTotal;

    return {
        invoiceNumber: getInvoiceNumber({ sellerId: seller?._id || seller?.id || "", periodKey: resolvedPeriod.key }),
        periodKey: resolvedPeriod.key,
        periodStart: resolvedPeriod.start.toISOString(),
        periodEnd: resolvedPeriod.end.toISOString(),
        subscriptionPlan: subscription.plan,
        subscriptionStatus: subscription.status,
        subscriptionFee: subscription.monthlyFee,
        subscriptionAccess: access,
        commissionRate,
        completedOrders: orderCount,
        completedSubtotal,
        commissionTotal,
        totalDue,
        commissionStatus: orderCount > 0 ? COMMISSION_STATUSES.EARNED : COMMISSION_STATUSES.PENDING,
    };
};

export const buildRiderInvoiceSnapshot = ({
    rider = {},
    orders = [],
    now = new Date(),
    period = null,
} = {}) => {
    const resolvedPeriod = period || getCurrentBillingPeriod(now);
    const subscription = getRiderSubscriptionSnapshot(rider);
    const access = getRiderAccessState(rider, { now });
    const periodDeliveries = getCompletedRiderDeliveriesForPeriod(orders, resolvedPeriod);

    const payoutTotal = periodDeliveries.reduce((sum, order) => sum + (Number(order?.deliveryFee) || 0), 0);

    return {
        invoiceNumber: getInvoiceNumber({ sellerId: rider?._id || rider?.id || "", periodKey: resolvedPeriod.key }).replace("INV", "RID"),
        periodKey: resolvedPeriod.key,
        periodStart: resolvedPeriod.start.toISOString(),
        periodEnd: resolvedPeriod.end.toISOString(),
        subscriptionPlan: subscription.plan,
        subscriptionStatus: subscription.status,
        subscriptionFee: subscription.monthlyFee,
        subscriptionAccess: access,
        completedDeliveries: periodDeliveries.length,
        payoutTotal,
        totalDue: subscription.monthlyFee,
        netBalance: payoutTotal - subscription.monthlyFee,
    };
};

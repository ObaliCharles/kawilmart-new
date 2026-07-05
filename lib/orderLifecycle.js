export const ORDER_STATUSES = {
    PLACED: "PLACED",
    ACCEPTED: "ACCEPTED",
    PROCESSING: "PROCESSING",
    READY: "READY",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
};

export const ORDER_STATUS_SEQUENCE = [
    ORDER_STATUSES.PLACED,
    ORDER_STATUSES.ACCEPTED,
    ORDER_STATUSES.PROCESSING,
    ORDER_STATUSES.READY,
    ORDER_STATUSES.OUT_FOR_DELIVERY,
    ORDER_STATUSES.DELIVERED,
    ORDER_STATUSES.COMPLETED,
    ORDER_STATUSES.FAILED,
    ORDER_STATUSES.CANCELLED,
];

export const ORDER_STATUS_LABELS = {
    [ORDER_STATUSES.PLACED]: "Placed",
    [ORDER_STATUSES.ACCEPTED]: "Accepted",
    [ORDER_STATUSES.PROCESSING]: "Processing",
    [ORDER_STATUSES.READY]: "Ready",
    [ORDER_STATUSES.OUT_FOR_DELIVERY]: "Out for delivery",
    [ORDER_STATUSES.DELIVERED]: "Delivered",
    [ORDER_STATUSES.COMPLETED]: "Completed",
    [ORDER_STATUSES.FAILED]: "Failed",
    [ORDER_STATUSES.CANCELLED]: "Cancelled",
};

export const DELIVERY_MODES = {
    DELIVERY: "DELIVERY",
    PICKUP: "PICKUP",
};

export const DELIVERY_MODE_LABELS = {
    [DELIVERY_MODES.DELIVERY]: "Delivery",
    [DELIVERY_MODES.PICKUP]: "Pickup",
};

export const RIDER_ASSIGNMENT_STATUSES = {
    UNASSIGNED: "UNASSIGNED",
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    DECLINED: "DECLINED",
};

export const RIDER_ASSIGNMENT_STATUS_LABELS = {
    [RIDER_ASSIGNMENT_STATUSES.UNASSIGNED]: "Unassigned",
    [RIDER_ASSIGNMENT_STATUSES.PENDING]: "Awaiting rider response",
    [RIDER_ASSIGNMENT_STATUSES.ACCEPTED]: "Rider accepted",
    [RIDER_ASSIGNMENT_STATUSES.DECLINED]: "Rider declined",
};

export const PAYMENT_STATUSES = {
    PENDING: "Pending",
    PAID: "Paid",
    FAILED: "Failed",
};

export const COMMISSION_STATUSES = {
    PENDING: "pending",
    EARNED: "earned",
    INVOICED: "invoiced",
    PAID: "paid",
    WAIVED: "waived",
};

export const DEFAULT_COMMISSION_RATE = 0.02;

export const DELIVERY_PRICE_BANDS = {
    SAME_AREA: 3000,
    SAME_CITY: 5000,
    SAME_REGION: 7000,
    NATIONAL: 9000,
};

const LEGACY_STATUS_MAP = {
    ORDER_PLACED: ORDER_STATUSES.PLACED,
    PLACED: ORDER_STATUSES.PLACED,
    CONFIRMED: ORDER_STATUSES.ACCEPTED,
    ACCEPTED: ORDER_STATUSES.ACCEPTED,
    PREPARING: ORDER_STATUSES.PROCESSING,
    PROCESSING: ORDER_STATUSES.PROCESSING,
    READY_FOR_DELIVERY: ORDER_STATUSES.READY,
    READY: ORDER_STATUSES.READY,
    SHIPPED: ORDER_STATUSES.OUT_FOR_DELIVERY,
    OUT_FOR_DELIVERY: ORDER_STATUSES.OUT_FOR_DELIVERY,
    DELIVERED: ORDER_STATUSES.DELIVERED,
    COMPLETED: ORDER_STATUSES.COMPLETED,
    FAILED: ORDER_STATUSES.FAILED,
    CANCELLED: ORDER_STATUSES.CANCELLED,
};

export const TERMINAL_ORDER_STATUSES = new Set([
    ORDER_STATUSES.COMPLETED,
    ORDER_STATUSES.FAILED,
    ORDER_STATUSES.CANCELLED,
]);

export const ACTIVE_ORDER_STATUSES = new Set(
    ORDER_STATUS_SEQUENCE.filter((status) => !TERMINAL_ORDER_STATUSES.has(status))
);

export const CONTACT_VISIBLE_STATUSES = new Set([
    ORDER_STATUSES.ACCEPTED,
    ORDER_STATUSES.PROCESSING,
    ORDER_STATUSES.READY,
    ORDER_STATUSES.OUT_FOR_DELIVERY,
    ORDER_STATUSES.DELIVERED,
    ORDER_STATUSES.COMPLETED,
]);

export const CUSTOMER_TRACKING_STEPS = [
    { label: "Placed", statuses: [ORDER_STATUSES.PLACED, ORDER_STATUSES.ACCEPTED] },
    { label: "Processing", statuses: [ORDER_STATUSES.PROCESSING] },
    { label: "Ready", statuses: [ORDER_STATUSES.READY] },
    { label: "On the way", statuses: [ORDER_STATUSES.OUT_FOR_DELIVERY] },
    { label: "Delivered", statuses: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.COMPLETED] },
];

const normalizeStatusToken = (value = "") => (
    String(value)
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
);

export const normalizeOrderStatus = (status) => {
    const normalized = normalizeStatusToken(status);
    return LEGACY_STATUS_MAP[normalized] || ORDER_STATUSES.PLACED;
};

export const normalizeDeliveryMode = (value, deliveryRequired = null) => {
    const normalized = normalizeStatusToken(value);

    if (normalized === DELIVERY_MODES.PICKUP) {
        return DELIVERY_MODES.PICKUP;
    }

    if (normalized === DELIVERY_MODES.DELIVERY) {
        return DELIVERY_MODES.DELIVERY;
    }

    if (deliveryRequired === false) {
        return DELIVERY_MODES.PICKUP;
    }

    return DELIVERY_MODES.DELIVERY;
};

export const normalizeRiderAssignmentStatus = (value, riderId = "") => {
    const normalized = normalizeStatusToken(value);

    if (normalized && RIDER_ASSIGNMENT_STATUSES[normalized]) {
        return RIDER_ASSIGNMENT_STATUSES[normalized];
    }

    if (normalized === RIDER_ASSIGNMENT_STATUSES.DECLINED) {
        return RIDER_ASSIGNMENT_STATUSES.DECLINED;
    }

    return riderId ? RIDER_ASSIGNMENT_STATUSES.PENDING : RIDER_ASSIGNMENT_STATUSES.UNASSIGNED;
};

export const getOrderStatusLabel = (status) => {
    const normalized = normalizeOrderStatus(status);
    return ORDER_STATUS_LABELS[normalized] || "Placed";
};

export const getDeliveryModeLabel = (deliveryMode, deliveryRequired = null) => {
    const normalized = normalizeDeliveryMode(deliveryMode, deliveryRequired);
    return DELIVERY_MODE_LABELS[normalized];
};

export const isTerminalOrderStatus = (status) => TERMINAL_ORDER_STATUSES.has(normalizeOrderStatus(status));

export const isPickupOrder = (order = {}) => (
    normalizeDeliveryMode(order?.deliveryMode, order?.deliveryRequired) === DELIVERY_MODES.PICKUP
);

export const isDeliveryOrder = (order = {}) => !isPickupOrder(order);

export const isContactUnlocked = (order = {}) => {
    if (order?.contactUnlockedAt) {
        return true;
    }

    return CONTACT_VISIBLE_STATUSES.has(normalizeOrderStatus(order?.status));
};

export const canRevealSellerContactToCustomer = (order = {}) => isContactUnlocked(order);

export const canRevealCustomerContactToSeller = (order = {}) => isContactUnlocked(order);

export const canRevealDeliveryContactsToRider = (order = {}) => (
    normalizeRiderAssignmentStatus(order?.riderAssignmentStatus, order?.riderId) === RIDER_ASSIGNMENT_STATUSES.ACCEPTED
);

export const canRevealRiderContactToCustomer = (order = {}) => (
    normalizeRiderAssignmentStatus(order?.riderAssignmentStatus, order?.riderId) === RIDER_ASSIGNMENT_STATUSES.ACCEPTED
);

export const calculateCommission = (subtotal = 0, rate = DEFAULT_COMMISSION_RATE) => {
    const safeSubtotal = Math.max(0, Number(subtotal) || 0);
    const safeRate = Math.max(0, Number(rate) || DEFAULT_COMMISSION_RATE);
    return Math.round(safeSubtotal * safeRate);
};

const normalizeLocationParts = (value = "") => (
    String(value)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
);

const hasLocationOverlap = (left = "", right = "") => {
    const leftTokens = new Set(normalizeLocationParts(left));
    return normalizeLocationParts(right).some((token) => leftTokens.has(token));
};

export const calculateDeliveryFee = ({
    deliveryMode = DELIVERY_MODES.DELIVERY,
    sellerLocation = "",
    address = null,
} = {}) => {
    if (normalizeDeliveryMode(deliveryMode) === DELIVERY_MODES.PICKUP) {
        return 0;
    }

    const sellerBase = sellerLocation || "";
    const area = address?.area || "";
    const city = address?.city || "";
    const state = address?.state || "";

    if (hasLocationOverlap(sellerBase, area)) {
        return DELIVERY_PRICE_BANDS.SAME_AREA;
    }

    if (hasLocationOverlap(sellerBase, city)) {
        return DELIVERY_PRICE_BANDS.SAME_CITY;
    }

    if (hasLocationOverlap(sellerBase, state)) {
        return DELIVERY_PRICE_BANDS.SAME_REGION;
    }

    return DELIVERY_PRICE_BANDS.NATIONAL;
};

export const buildOrderFinancials = ({
    subtotal = 0,
    deliveryFee = 0,
    commissionRate = DEFAULT_COMMISSION_RATE,
} = {}) => {
    const safeSubtotal = Math.max(0, Number(subtotal) || 0);
    const safeDeliveryFee = Math.max(0, Number(deliveryFee) || 0);
    const commissionAmount = calculateCommission(safeSubtotal, commissionRate);

    return {
        subtotal: safeSubtotal,
        deliveryFee: safeDeliveryFee,
        amount: safeSubtotal + safeDeliveryFee,
        commissionRate: Number(commissionRate) || DEFAULT_COMMISSION_RATE,
        commissionAmount,
    };
};

export const getCustomerTrackingStepIndex = (status) => {
    const normalized = normalizeOrderStatus(status);

    if (normalized === ORDER_STATUSES.CANCELLED || normalized === ORDER_STATUSES.FAILED) {
        return 0;
    }

    const foundIndex = CUSTOMER_TRACKING_STEPS.findIndex((step) => step.statuses.includes(normalized));
    return foundIndex === -1 ? 0 : foundIndex;
};

export const canAssignRiderToOrder = (order = {}) => (
    isDeliveryOrder(order) && [
        ORDER_STATUSES.ACCEPTED,
        ORDER_STATUSES.PROCESSING,
        ORDER_STATUSES.READY,
    ].includes(normalizeOrderStatus(order?.status))
);

export const canCustomerConfirmOrder = (order = {}) => {
    const normalized = normalizeOrderStatus(order?.status);
    return normalized === ORDER_STATUSES.DELIVERED && !order?.customerConfirmedAt;
};

export const canCustomerReviewSeller = (order = {}) => (
    normalizeOrderStatus(order?.status) === ORDER_STATUSES.COMPLETED && !order?.sellerReview?.submittedAt
);

export const getAllowedNextStatuses = (order = {}, actorRole = "customer") => {
    const status = normalizeOrderStatus(order?.status);
    const deliveryOrder = isDeliveryOrder(order);
    const assignmentStatus = normalizeRiderAssignmentStatus(order?.riderAssignmentStatus, order?.riderId);

    if (actorRole === "seller") {
        if (status === ORDER_STATUSES.PLACED) {
            return [ORDER_STATUSES.ACCEPTED, ORDER_STATUSES.FAILED];
        }

        if (status === ORDER_STATUSES.ACCEPTED) {
            return [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.FAILED];
        }

        if (status === ORDER_STATUSES.PROCESSING) {
            return [ORDER_STATUSES.READY, ORDER_STATUSES.FAILED];
        }

        if (status === ORDER_STATUSES.READY && !deliveryOrder) {
            return [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.FAILED];
        }

        return [];
    }

    if (actorRole === "rider") {
        if (!deliveryOrder || assignmentStatus !== RIDER_ASSIGNMENT_STATUSES.ACCEPTED) {
            return [];
        }

        if (status === ORDER_STATUSES.READY) {
            return [ORDER_STATUSES.OUT_FOR_DELIVERY];
        }

        if (status === ORDER_STATUSES.OUT_FOR_DELIVERY) {
            return [ORDER_STATUSES.DELIVERED];
        }

        return [];
    }

    if (actorRole === "customer") {
        if (status === ORDER_STATUSES.DELIVERED) {
            return [ORDER_STATUSES.COMPLETED];
        }

        return [];
    }

    if (actorRole === "admin") {
        if (status === ORDER_STATUSES.PLACED) {
            return [ORDER_STATUSES.ACCEPTED, ORDER_STATUSES.FAILED, ORDER_STATUSES.CANCELLED];
        }

        if (status === ORDER_STATUSES.ACCEPTED) {
            return [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.FAILED, ORDER_STATUSES.CANCELLED];
        }

        if (status === ORDER_STATUSES.PROCESSING) {
            return [ORDER_STATUSES.READY, ORDER_STATUSES.FAILED, ORDER_STATUSES.CANCELLED];
        }

        if (status === ORDER_STATUSES.READY) {
            return deliveryOrder
                ? [ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.FAILED, ORDER_STATUSES.CANCELLED]
                : [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.FAILED, ORDER_STATUSES.CANCELLED];
        }

        if (status === ORDER_STATUSES.OUT_FOR_DELIVERY) {
            return [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.FAILED];
        }

        if (status === ORDER_STATUSES.DELIVERED) {
            return [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.FAILED];
        }

        return [];
    }

    return [];
};

export const getCurrentBillingPeriod = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
        start,
        end,
        key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
    };
};

export const getInvoiceNumber = ({ sellerId = "", periodKey = "" } = {}) => {
    const shortSellerId = String(sellerId).slice(-6).toUpperCase() || "SELLER";
    return `INV-${periodKey.replace("-", "")}-${shortSellerId}`;
};

import {
    CUSTOMER_TRACKING_STEPS,
    ORDER_STATUSES,
    ORDER_STATUS_SEQUENCE,
    PAYMENT_STATUSES,
    RIDER_ASSIGNMENT_STATUSES,
    getCustomerTrackingStepIndex,
    getOrderStatusLabel,
    normalizeOrderStatus,
    normalizeRiderAssignmentStatus,
} from "@/lib/orderLifecycle";

export { CUSTOMER_TRACKING_STEPS, ORDER_STATUS_SEQUENCE, getCustomerTrackingStepIndex };

const STATUS_EVENT_COPY = {
    [ORDER_STATUSES.PLACED]: {
        title: "Order placed",
        description: "Your order was created inside KawilMart and is waiting for the seller to accept it.",
    },
    [ORDER_STATUSES.ACCEPTED]: {
        title: "Order accepted",
        description: "The seller accepted your order. Contact details are now unlocked inside the marketplace.",
    },
    [ORDER_STATUSES.PROCESSING]: {
        title: "Order processing",
        description: "The seller is preparing your items.",
    },
    [ORDER_STATUSES.READY]: {
        title: "Order ready",
        description: "Your order is packed and ready for pickup or rider handoff.",
    },
    [ORDER_STATUSES.OUT_FOR_DELIVERY]: {
        title: "Out for delivery",
        description: "A rider is on the way with your order.",
    },
    [ORDER_STATUSES.DELIVERED]: {
        title: "Delivered",
        description: "The order was marked delivered. Please confirm receipt to complete it.",
    },
    [ORDER_STATUSES.COMPLETED]: {
        title: "Order completed",
        description: "You confirmed receipt and the order is now complete.",
    },
    [ORDER_STATUSES.FAILED]: {
        title: "Order failed",
        description: "This order could not be fulfilled and was closed.",
    },
    [ORDER_STATUSES.CANCELLED]: {
        title: "Order cancelled",
        description: "This order was cancelled before completion.",
    },
};

const PAYMENT_EVENT_COPY = {
    [PAYMENT_STATUSES.PENDING]: {
        title: "Payment pending",
        description: "Payment is still pending for this order.",
    },
    [PAYMENT_STATUSES.PAID]: {
        title: "Payment confirmed",
        description: "Payment for this order was confirmed.",
    },
    [PAYMENT_STATUSES.FAILED]: {
        title: "Payment failed",
        description: "There was a payment issue on this order.",
    },
};

const SELLER_STATUS_NOTIFICATION_COPY = {
    [ORDER_STATUSES.PLACED]: {
        title: "New order received",
        description: "A customer placed a new order in your store.",
    },
    [ORDER_STATUSES.ACCEPTED]: {
        title: "Order accepted",
        description: "This order has been accepted and contact sharing is now enabled inside the platform.",
    },
    [ORDER_STATUSES.PROCESSING]: {
        title: "Order processing",
        description: "This order is being prepared.",
    },
    [ORDER_STATUSES.READY]: {
        title: "Order ready",
        description: "This order is ready for pickup or delivery handoff.",
    },
    [ORDER_STATUSES.OUT_FOR_DELIVERY]: {
        title: "Out for delivery",
        description: "A rider is currently delivering this order.",
    },
    [ORDER_STATUSES.DELIVERED]: {
        title: "Delivered",
        description: "This order has been marked delivered and is waiting for customer confirmation.",
    },
    [ORDER_STATUSES.COMPLETED]: {
        title: "Order completed",
        description: "The customer confirmed receipt, so this order is complete.",
    },
    [ORDER_STATUSES.FAILED]: {
        title: "Order failed",
        description: "This order was closed without completion.",
    },
    [ORDER_STATUSES.CANCELLED]: {
        title: "Order cancelled",
        description: "This order was cancelled before completion.",
    },
};

const toISOString = (value, fallback = null) => {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return fallback;
    }

    return date.toISOString();
};

export const getStatusTrackingCopy = (status) => {
    const normalized = normalizeOrderStatus(status);
    return STATUS_EVENT_COPY[normalized] || {
        title: getOrderStatusLabel(normalized),
        description: "Your order status has been updated.",
    };
};

export const getPaymentTrackingCopy = (paymentStatus) => {
    const normalized = Object.values(PAYMENT_STATUSES).includes(paymentStatus)
        ? paymentStatus
        : PAYMENT_STATUSES.PENDING;

    return PAYMENT_EVENT_COPY[normalized] || {
        title: "Payment updated",
        description: "The payment status for your order has been updated.",
    };
};

export const getSellerStatusNotificationCopy = (status) => {
    const normalized = normalizeOrderStatus(status);
    return SELLER_STATUS_NOTIFICATION_COPY[normalized] || {
        title: getOrderStatusLabel(normalized),
        description: "An order in your store has been updated.",
    };
};

export const createTrackingEvent = ({
    type = "status",
    status = "",
    title = "",
    description = "",
    timestamp = new Date(),
}) => ({
    type,
    status,
    title,
    description,
    timestamp,
});

export const createStatusTrackingEvent = (status, timestamp = new Date()) => {
    const normalized = normalizeOrderStatus(status);
    const copy = getStatusTrackingCopy(normalized);

    return createTrackingEvent({
        type: "status",
        status: normalized,
        title: copy.title,
        description: copy.description,
        timestamp,
    });
};

export const createRiderAssignmentTrackingEvent = ({
    assigned = true,
    accepted = false,
    declined = false,
    timestamp = new Date(),
} = {}) => {
    let title = "Rider assignment updated";
    let description = "The delivery assignment was updated.";
    let status = "";

    if (assigned) {
        title = "Rider assigned";
        description = "A rider has been assigned and is reviewing the delivery request.";
        status = RIDER_ASSIGNMENT_STATUSES.PENDING;
    }

    if (accepted) {
        title = "Rider accepted";
        description = "The assigned rider accepted this delivery job.";
        status = RIDER_ASSIGNMENT_STATUSES.ACCEPTED;
    }

    if (declined) {
        title = "Rider declined";
        description = "The assigned rider declined this delivery job and the order needs reassignment.";
        status = RIDER_ASSIGNMENT_STATUSES.DECLINED;
    }

    return createTrackingEvent({
        type: "assignment",
        status,
        title,
        description,
        timestamp,
    });
};

export const createPaymentTrackingEvent = (paymentStatus, timestamp = new Date()) => {
    const copy = getPaymentTrackingCopy(paymentStatus);

    return createTrackingEvent({
        type: "system",
        status: paymentStatus,
        title: copy.title,
        description: copy.description,
        timestamp,
    });
};

export const createCustomerNotification = ({ title, message }) => ({
    type: "order",
    title,
    message,
    read: false,
    date: new Date(),
});

export const createStatusNotification = (status, orderId) => {
    const copy = getStatusTrackingCopy(status);
    const shortOrderId = String(orderId).slice(-8).toUpperCase();

    return createCustomerNotification({
        title: copy.title,
        message: `Order #${shortOrderId}: ${copy.description}`,
    });
};

export const createAssignmentNotification = (orderId, assigned = true) => {
    const shortOrderId = String(orderId).slice(-8).toUpperCase();

    return createCustomerNotification({
        title: assigned ? "Rider assigned" : "Delivery assignment updated",
        message: assigned
            ? `Order #${shortOrderId}: a rider has been assigned and must accept the job.`
            : `Order #${shortOrderId}: the delivery assignment has been updated.`,
    });
};

export const createPaymentNotification = (paymentStatus, orderId) => {
    const copy = getPaymentTrackingCopy(paymentStatus);
    const shortOrderId = String(orderId).slice(-8).toUpperCase();

    return createCustomerNotification({
        title: copy.title,
        message: `Order #${shortOrderId}: ${copy.description}`,
    });
};

export const createSellerOrderPlacedNotification = ({
    orderId,
    customerName = "A customer",
    totalItems = 0,
    totalAmount = "",
}) => {
    const shortOrderId = String(orderId).slice(-8).toUpperCase();
    const normalizedItemCount = Number(totalItems) || 0;
    const itemLabel = normalizedItemCount === 1 ? "item" : "items";
    const amountCopy = totalAmount ? ` totaling ${totalAmount}` : "";

    return {
        type: "order",
        title: "New order received",
        message: `${customerName} placed order #${shortOrderId} for ${normalizedItemCount} ${itemLabel}${amountCopy}.`,
        read: false,
        date: new Date(),
    };
};

export const createSellerStatusNotification = (status, orderId) => {
    const copy = getSellerStatusNotificationCopy(status);
    const shortOrderId = String(orderId).slice(-8).toUpperCase();

    return {
        type: "order",
        title: copy.title,
        message: `Order #${shortOrderId}: ${copy.description}`,
        read: false,
        date: new Date(),
    };
};

export const ensureTrackingEvents = (order) => {
    const existingEvents = Array.isArray(order?.trackingEvents) ? order.trackingEvents : [];
    if (existingEvents.length > 0) {
        return existingEvents.map((event) => ({
            ...event,
            status: event?.type === "status" ? normalizeOrderStatus(event?.status) : event?.status,
        }));
    }

    const fallbackEvents = [
        createStatusTrackingEvent(ORDER_STATUSES.PLACED, order?.date || new Date()),
    ];

    if (order?.acceptedAt) {
        fallbackEvents.push(createStatusTrackingEvent(ORDER_STATUSES.ACCEPTED, order.acceptedAt));
    }

    if (order?.paymentStatus && order.paymentStatus !== PAYMENT_STATUSES.PENDING) {
        fallbackEvents.push(createPaymentTrackingEvent(order.paymentStatus, order?.date || new Date()));
    }

    if (order?.riderId) {
        const assignmentStatus = normalizeRiderAssignmentStatus(order?.riderAssignmentStatus, order?.riderId);
        fallbackEvents.push(createRiderAssignmentTrackingEvent({
            assigned: assignmentStatus === RIDER_ASSIGNMENT_STATUSES.PENDING,
            accepted: assignmentStatus === RIDER_ASSIGNMENT_STATUSES.ACCEPTED,
            declined: assignmentStatus === RIDER_ASSIGNMENT_STATUSES.DECLINED,
            timestamp: order?.riderAcceptedAt || order?.date || new Date(),
        }));
    }

    const normalizedStatus = normalizeOrderStatus(order?.status);
    if (normalizedStatus !== ORDER_STATUSES.PLACED) {
        fallbackEvents.push(createStatusTrackingEvent(normalizedStatus, order?.deliveredAt || order?.date || new Date()));
    }

    return fallbackEvents;
};

export const serializeTrackingEvents = (trackingEvents) => (
    (Array.isArray(trackingEvents) ? trackingEvents : []).map((event, index) => ({
        id: String(event?._id || `${event?.type || "event"}-${index}`),
        type: event?.type || "status",
        status: event?.type === "status" ? normalizeOrderStatus(event?.status) : event?.status || "",
        title: event?.title || "Order updated",
        description: event?.description || "",
        timestamp: toISOString(event?.timestamp, toISOString(new Date())),
    }))
);

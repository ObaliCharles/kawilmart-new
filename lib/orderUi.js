import {
    ORDER_STATUSES,
    PAYMENT_STATUSES,
    RIDER_ASSIGNMENT_STATUSES,
    getOrderStatusLabel,
    normalizeOrderStatus,
    normalizeRiderAssignmentStatus,
} from "@/lib/orderLifecycle";

const ORDER_STATUS_BADGES = {
    [ORDER_STATUSES.PLACED]: "bg-blue-100 text-blue-700",
    [ORDER_STATUSES.ACCEPTED]: "bg-sky-100 text-sky-700",
    [ORDER_STATUSES.PROCESSING]: "bg-amber-100 text-amber-700",
    [ORDER_STATUSES.READY]: "bg-cyan-100 text-cyan-700",
    [ORDER_STATUSES.OUT_FOR_DELIVERY]: "bg-indigo-100 text-indigo-700",
    [ORDER_STATUSES.DELIVERED]: "bg-green-100 text-green-700",
    [ORDER_STATUSES.COMPLETED]: "bg-emerald-100 text-emerald-700",
    [ORDER_STATUSES.FAILED]: "bg-red-100 text-red-700",
    [ORDER_STATUSES.CANCELLED]: "bg-slate-100 text-slate-700",
};

const PAYMENT_STATUS_BADGES = {
    [PAYMENT_STATUSES.PENDING]: "bg-amber-100 text-amber-700",
    [PAYMENT_STATUSES.PAID]: "bg-green-100 text-green-700",
    [PAYMENT_STATUSES.FAILED]: "bg-red-100 text-red-700",
};

const RIDER_ASSIGNMENT_BADGES = {
    [RIDER_ASSIGNMENT_STATUSES.UNASSIGNED]: "bg-slate-100 text-slate-700",
    [RIDER_ASSIGNMENT_STATUSES.PENDING]: "bg-blue-100 text-blue-700",
    [RIDER_ASSIGNMENT_STATUSES.ACCEPTED]: "bg-green-100 text-green-700",
    [RIDER_ASSIGNMENT_STATUSES.DECLINED]: "bg-red-100 text-red-700",
};

export const getOrderStatusBadgeClass = (status) => (
    ORDER_STATUS_BADGES[normalizeOrderStatus(status)] || "bg-gray-100 text-gray-700"
);

export const getPaymentStatusBadgeClass = (paymentStatus) => (
    PAYMENT_STATUS_BADGES[paymentStatus] || "bg-gray-100 text-gray-700"
);

export const getRiderAssignmentBadgeClass = (assignmentStatus, riderId = "") => (
    RIDER_ASSIGNMENT_BADGES[normalizeRiderAssignmentStatus(assignmentStatus, riderId)] || "bg-gray-100 text-gray-700"
);

export const getOrderStatusDisplay = (status) => getOrderStatusLabel(status);

import { ORDER_STATUSES, normalizeOrderStatus } from "@/lib/orderLifecycle";

export const getOrderRiskFlags = (order = {}) => {
    const flags = [];
    const status = normalizeOrderStatus(order?.status);
    const cancelled = status === ORDER_STATUSES.CANCELLED;
    const failed = status === ORDER_STATUSES.FAILED;

    if (cancelled) {
        flags.push("cancelled_order");
    }

    if (failed) {
        flags.push("failed_order");
    }

    if (status === ORDER_STATUSES.DELIVERED && order?.deliveredAt && !order?.customerConfirmedAt) {
        const deliveredAt = new Date(order.deliveredAt).getTime();
        const hoursSinceDelivery = Number.isFinite(deliveredAt)
            ? (Date.now() - deliveredAt) / (1000 * 60 * 60)
            : 0;

        if (hoursSinceDelivery >= 48) {
            flags.push("awaiting_customer_confirmation");
        }
    }

    return flags;
};

export const getSellerRiskSummary = (orders = []) => {
    const totalOrders = orders.length;
    const cancelledOrders = orders.filter((order) => normalizeOrderStatus(order?.status) === ORDER_STATUSES.CANCELLED).length;
    const failedOrders = orders.filter((order) => normalizeOrderStatus(order?.status) === ORDER_STATUSES.FAILED).length;
    const disputedDeliveries = orders.filter((order) => (
        normalizeOrderStatus(order?.status) === ORDER_STATUSES.DELIVERED && !order?.customerConfirmedAt
    )).length;

    const cancellationRate = totalOrders ? Math.round((cancelledOrders / totalOrders) * 100) : 0;
    const failureRate = totalOrders ? Math.round((failedOrders / totalOrders) * 100) : 0;
    const flagged = cancellationRate >= 20 || failureRate >= 15 || disputedDeliveries >= 3;

    return {
        totalOrders,
        cancelledOrders,
        failedOrders,
        disputedDeliveries,
        cancellationRate,
        failureRate,
        flagged,
    };
};

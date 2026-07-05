import {
    ORDER_STATUSES,
    RIDER_ASSIGNMENT_STATUSES,
    canAssignRiderToOrder,
    getAllowedNextStatuses,
    normalizeOrderStatus,
    normalizeRiderAssignmentStatus,
} from "@/lib/orderLifecycle";
import { getOrderRiskFlags } from "@/lib/orderRisk";
import {
    getSellerRatingSummary,
    getSellerReviewOverall,
    normalizeSellerReviewInput,
} from "@/lib/sellerReviews";

export const formatShortOrderId = (orderId) => String(orderId || "").slice(-8).toUpperCase();

export const syncOrderRiskFlags = (order) => {
    order.riskFlags = getOrderRiskFlags({
        status: order?.status,
        deliveredAt: order?.deliveredAt,
        customerConfirmedAt: order?.customerConfirmedAt,
    });

    return order.riskFlags;
};

export const applyOrderStatusTransition = ({
    order,
    nextStatus,
    actorRole = "customer",
    allowNoop = true,
} = {}) => {
    const currentStatus = normalizeOrderStatus(order?.status);
    const normalizedNextStatus = normalizeOrderStatus(nextStatus);

    if (normalizedNextStatus === currentStatus) {
        if (allowNoop) {
            return {
                changed: false,
                previousStatus: currentStatus,
                nextStatus: normalizedNextStatus,
            };
        }

        throw new Error("The order is already in that status.");
    }

    const allowedNextStatuses = getAllowedNextStatuses(order, actorRole);
    if (!allowedNextStatuses.includes(normalizedNextStatus)) {
        throw new Error(`This order cannot move from ${currentStatus} to ${normalizedNextStatus}.`);
    }

    const now = new Date();
    order.status = normalizedNextStatus;

    if (normalizedNextStatus === ORDER_STATUSES.ACCEPTED) {
        order.acceptedAt = order.acceptedAt || now;
        order.contactUnlockedAt = order.contactUnlockedAt || now;
    }

    if (normalizedNextStatus === ORDER_STATUSES.READY) {
        order.readyAt = order.readyAt || now;
    }

    if (normalizedNextStatus === ORDER_STATUSES.DELIVERED) {
        order.deliveredAt = now;
        order.deliveredByRole = actorRole === "admin" ? "admin" : actorRole;
    }

    if (normalizedNextStatus === ORDER_STATUSES.COMPLETED) {
        order.deliveredAt = order.deliveredAt || now;
        order.customerConfirmedAt = now;
    }

    syncOrderRiskFlags(order);

    return {
        changed: true,
        previousStatus: currentStatus,
        nextStatus: normalizedNextStatus,
    };
};

export const assignRiderToOrder = ({
    order,
    riderId = "",
} = {}) => {
    if (!canAssignRiderToOrder(order)) {
        throw new Error("This order is not ready for rider assignment yet.");
    }

    const previousRiderId = order?.riderId || "";
    const nextRiderId = String(riderId || "").trim();

    if (!nextRiderId) {
        const hadRider = !!previousRiderId;
        order.riderId = null;
        order.riderAssignmentStatus = RIDER_ASSIGNMENT_STATUSES.UNASSIGNED;
        order.riderAcceptedAt = null;
        syncOrderRiskFlags(order);

        return {
            changed: hadRider,
            previousRiderId,
            nextRiderId: "",
            assignmentStatus: RIDER_ASSIGNMENT_STATUSES.UNASSIGNED,
        };
    }

    const assignmentAlreadyCurrent = previousRiderId === nextRiderId
        && normalizeRiderAssignmentStatus(order?.riderAssignmentStatus, order?.riderId) !== RIDER_ASSIGNMENT_STATUSES.DECLINED;

    if (assignmentAlreadyCurrent) {
        return {
            changed: false,
            previousRiderId,
            nextRiderId,
            assignmentStatus: normalizeRiderAssignmentStatus(order?.riderAssignmentStatus, order?.riderId),
        };
    }

    order.riderId = nextRiderId;
    order.riderAssignmentStatus = RIDER_ASSIGNMENT_STATUSES.PENDING;
    order.riderAcceptedAt = null;
    order.riderDeclinedAt = null;
    syncOrderRiskFlags(order);

    return {
        changed: true,
        previousRiderId,
        nextRiderId,
        assignmentStatus: RIDER_ASSIGNMENT_STATUSES.PENDING,
    };
};

export const respondToRiderAssignment = ({
    order,
    response,
} = {}) => {
    const normalizedResponse = String(response || "").trim().toUpperCase();
    const assignmentStatus = normalizeRiderAssignmentStatus(order?.riderAssignmentStatus, order?.riderId);
    const currentStatus = normalizeOrderStatus(order?.status);
    const now = new Date();

    if (normalizedResponse === "ACCEPT") {
        if (assignmentStatus !== RIDER_ASSIGNMENT_STATUSES.PENDING) {
            throw new Error("This delivery assignment is no longer awaiting a rider response.");
        }

        order.riderAssignmentStatus = RIDER_ASSIGNMENT_STATUSES.ACCEPTED;
        order.riderAcceptedAt = now;
        order.riderDeclinedAt = null;
        syncOrderRiskFlags(order);

        return {
            changed: true,
            assignmentStatus: RIDER_ASSIGNMENT_STATUSES.ACCEPTED,
        };
    }

    if (normalizedResponse === "DECLINE") {
        if (![RIDER_ASSIGNMENT_STATUSES.PENDING, RIDER_ASSIGNMENT_STATUSES.ACCEPTED].includes(assignmentStatus)) {
            throw new Error("This delivery assignment cannot be declined right now.");
        }

        if ([ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.COMPLETED].includes(currentStatus)) {
            throw new Error("This delivery is already in progress and can no longer be declined.");
        }

        order.riderId = null;
        order.riderAssignmentStatus = RIDER_ASSIGNMENT_STATUSES.DECLINED;
        order.riderDeclinedAt = now;
        order.riderAcceptedAt = null;
        syncOrderRiskFlags(order);

        return {
            changed: true,
            assignmentStatus: RIDER_ASSIGNMENT_STATUSES.DECLINED,
        };
    }

    throw new Error("Unsupported rider response.");
};

export const applySellerReview = ({
    order,
    seller,
    reviewerId,
    reviewerName = "Customer",
    review = {},
} = {}) => {
    const normalizedReview = normalizeSellerReviewInput(review);

    if (!normalizedReview.reliability || !normalizedReview.speed || !normalizedReview.communication) {
        throw new Error("Please rate reliability, speed, and communication before submitting.");
    }

    const submittedAt = new Date();
    const overall = getSellerReviewOverall(normalizedReview);
    const reviewPayload = {
        reviewerId,
        reviewerName,
        reliability: normalizedReview.reliability,
        speed: normalizedReview.speed,
        communication: normalizedReview.communication,
        comment: normalizedReview.comment,
        submittedAt,
    };

    order.sellerReview = reviewPayload;

    const existingReviews = Array.isArray(seller?.sellerReviews) ? seller.sellerReviews.filter(Boolean) : [];
    seller.sellerReviews = [
        ...existingReviews.filter((existingReview) => String(existingReview?.orderId) !== String(order?._id)),
        {
            orderId: String(order?._id || ""),
            reviewerId,
            reviewerName,
            reliability: normalizedReview.reliability,
            speed: normalizedReview.speed,
            communication: normalizedReview.communication,
            comment: normalizedReview.comment,
            overall,
            date: submittedAt,
        },
    ];
    seller.sellerRatingSummary = getSellerRatingSummary(seller.sellerReviews);

    syncOrderRiskFlags(order);

    return {
        review: reviewPayload,
        overall,
        summary: seller.sellerRatingSummary,
    };
};

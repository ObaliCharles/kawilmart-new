import {
    ORDER_STATUSES,
    RIDER_ASSIGNMENT_STATUSES,
    canAssignRiderToOrder,
    canCustomerConfirmOrder,
    canCustomerReviewSeller,
    canRevealCustomerContactToSeller,
    canRevealDeliveryContactsToRider,
    canRevealRiderContactToCustomer,
    canRevealSellerContactToCustomer,
    getAllowedNextStatuses,
    getDeliveryModeLabel,
    getOrderStatusLabel,
    normalizeOrderStatus,
    normalizeRiderAssignmentStatus,
} from "@/lib/orderLifecycle";
import { getOrderRiskFlags } from "@/lib/orderRisk";
import { ensureTrackingEvents, serializeTrackingEvents } from "@/lib/orderTracking";

const toId = (value) => {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    return String(value?._id || value?.id || value);
};

const toSellerSnapshot = (seller = {}, fallback = {}) => ({
    id: toId(seller?._id || seller?.id || fallback?.id),
    name: seller?.businessName || seller?.name || fallback?.name || "Seller",
    phoneNumber: seller?.phoneNumber || fallback?.phoneNumber || "",
    location: seller?.businessLocation || fallback?.location || "",
    imageUrl: seller?.imageUrl || fallback?.imageUrl || "",
    ratingSummary: seller?.sellerRatingSummary || fallback?.ratingSummary || {
        totalReviews: 0,
        reliability: 0,
        speed: 0,
        communication: 0,
        overall: 0,
    },
});

const sanitizeProduct = (product) => {
    if (!product) {
        return null;
    }

    return {
        _id: toId(product),
        name: product?.name || "",
        image: product?.image || [],
        location: product?.location || "",
        sellerLocation: product?.sellerLocation || "",
    };
};

const toAddressSnapshot = (address = {}, includePhone = true) => ({
    fullName: address?.fullName || "",
    phoneNumber: includePhone ? (address?.phoneNumber || "") : "",
    area: address?.area || "",
    city: address?.city || "",
    state: address?.state || "",
    pincode: address?.pincode || "",
});

const getCommonOrderSnapshot = (order = {}) => {
    const status = normalizeOrderStatus(order?.status);
    const riderAssignmentStatus = normalizeRiderAssignmentStatus(order?.riderAssignmentStatus, order?.riderId);

    return {
        _id: toId(order),
        userId: toId(order?.userId),
        sellerId: toId(order?.sellerId),
        riderId: toId(order?.riderId),
        subtotal: Number(order?.subtotal) || 0,
        amount: Number(order?.amount) || 0,
        deliveryFee: Number(order?.deliveryFee) || 0,
        commissionAmount: Number(order?.commissionAmount) || 0,
        commissionRate: Number(order?.commissionRate) || 0,
        commissionStatus: order?.commissionStatus || "pending",
        status,
        statusLabel: getOrderStatusLabel(status),
        paymentStatus: order?.paymentStatus || "Pending",
        deliveryRequired: Boolean(order?.deliveryRequired),
        deliveryMode: order?.deliveryMode || "DELIVERY",
        deliveryModeLabel: getDeliveryModeLabel(order?.deliveryMode, order?.deliveryRequired),
        riderAssignmentStatus,
        customerPhone: order?.customerPhone || "",
        contactUnlockedAt: order?.contactUnlockedAt || null,
        acceptedAt: order?.acceptedAt || null,
        readyAt: order?.readyAt || null,
        deliveredAt: order?.deliveredAt || null,
        customerConfirmedAt: order?.customerConfirmedAt || null,
        deliveredByRole: order?.deliveredByRole || "",
        sellerNotes: order?.sellerNotes || "",
        date: order?.date,
        riskFlags: Array.isArray(order?.riskFlags) && order.riskFlags.length
            ? order.riskFlags
            : getOrderRiskFlags(order),
        trackingEvents: serializeTrackingEvents(ensureTrackingEvents(order)),
        sellerReview: order?.sellerReview?.submittedAt ? {
            reviewerId: order.sellerReview.reviewerId || "",
            reviewerName: order.sellerReview.reviewerName || "",
            reliability: Number(order.sellerReview.reliability) || 0,
            speed: Number(order.sellerReview.speed) || 0,
            communication: Number(order.sellerReview.communication) || 0,
            comment: order.sellerReview.comment || "",
            submittedAt: order.sellerReview.submittedAt,
        } : null,
        items: (order?.items || []).map((item) => ({
            quantity: Number(item?.quantity) || 0,
            price: Number(item?.price) || 0,
            product: sanitizeProduct(item?.product),
        })),
    };
};

export const serializeCustomerOrder = ({
    order,
    seller = null,
    rider = null,
    productFallback = null,
} = {}) => {
    const common = getCommonOrderSnapshot(order);
    const sellerContactVisible = canRevealSellerContactToCustomer(order);
    const riderContactVisible = canRevealRiderContactToCustomer(order);
    const sellerSnapshot = toSellerSnapshot(seller, {
        id: common.sellerId,
        phoneNumber: sellerContactVisible ? (productFallback?.sellerContact || "") : "",
        location: productFallback?.sellerLocation || productFallback?.location || "",
    });

    return {
        ...common,
        address: toAddressSnapshot(order?.address, true),
        seller: {
            ...sellerSnapshot,
            phoneNumber: sellerContactVisible ? sellerSnapshot.phoneNumber : "",
            contactUnlocked: sellerContactVisible,
        },
        rider: common.riderId ? {
            id: toId(rider),
            name: rider?.name || "Rider",
            phoneNumber: riderContactVisible ? (rider?.phoneNumber || "") : "",
            imageUrl: rider?.imageUrl || "",
            contactUnlocked: riderContactVisible,
        } : null,
        actions: {
            canConfirmDelivery: canCustomerConfirmOrder(order),
            canReviewSeller: canCustomerReviewSeller(order),
        },
    };
};

export const serializeSellerOrder = ({
    order,
    rider = null,
} = {}) => {
    const common = getCommonOrderSnapshot(order);
    const customerContactVisible = canRevealCustomerContactToSeller(order);

    return {
        ...common,
        address: toAddressSnapshot(order?.address, customerContactVisible),
        customerContactUnlocked: customerContactVisible,
        rider: common.riderId ? {
            id: toId(rider),
            name: rider?.name || "Rider",
            phoneNumber: rider?.phoneNumber || "",
            imageUrl: rider?.imageUrl || "",
            availability: rider?.riderAvailability || "available",
        } : null,
        actions: {
            allowedNextStatuses: getAllowedNextStatuses(order, "seller"),
            canAssignRider: canAssignRiderToOrder(order),
        },
    };
};

export const serializeRiderDelivery = ({
    order,
    seller = null,
    rider = null,
    productFallback = null,
} = {}) => {
    const common = getCommonOrderSnapshot(order);
    const contactsVisible = canRevealDeliveryContactsToRider(order);
    const allowedNextStatuses = getAllowedNextStatuses(order, "rider");
    const assignmentStatus = normalizeRiderAssignmentStatus(order?.riderAssignmentStatus, order?.riderId);
    const sellerSnapshot = toSellerSnapshot(seller, {
        id: common.sellerId,
        phoneNumber: contactsVisible ? (productFallback?.sellerContact || "") : "",
        location: productFallback?.sellerLocation || productFallback?.location || "",
    });

    return {
        ...common,
        seller: sellerSnapshot,
        pickup: {
            location: sellerSnapshot.location || productFallback?.sellerLocation || productFallback?.location || "",
            phoneNumber: contactsVisible ? sellerSnapshot.phoneNumber : "",
            stops: [...new Set((order?.items || []).map((item) => item?.product?.location).filter(Boolean))],
            contactUnlocked: contactsVisible,
        },
        dropoff: {
            ...toAddressSnapshot(order?.address, contactsVisible),
            customerName: order?.address?.fullName || "",
            location: [order?.address?.area, order?.address?.city, order?.address?.state].filter(Boolean).join(", "),
            phoneNumber: contactsVisible ? (order?.address?.phoneNumber || order?.customerPhone || "") : "",
        },
        rider: rider ? {
            id: toId(rider),
            name: rider?.name || "Rider",
            availability: rider?.riderAvailability || "available",
        } : null,
        actions: {
            canAcceptAssignment: assignmentStatus === RIDER_ASSIGNMENT_STATUSES.PENDING,
            canDeclineAssignment: assignmentStatus === RIDER_ASSIGNMENT_STATUSES.PENDING,
            canStartDelivery: allowedNextStatuses.includes(ORDER_STATUSES.OUT_FOR_DELIVERY),
            canMarkDelivered: allowedNextStatuses.includes(ORDER_STATUSES.DELIVERED),
        },
    };
};

export const serializeAdminOrder = (order = {}) => {
    const common = getCommonOrderSnapshot(order);

    return {
        ...common,
        address: toAddressSnapshot(order?.address, true),
        actions: {
            allowedNextStatuses: getAllowedNextStatuses(order, "admin"),
            canAssignRider: canAssignRiderToOrder(order),
        },
    };
};

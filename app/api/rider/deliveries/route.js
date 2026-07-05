import { getRequestUserId } from "@/lib/requestAuth";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import authRider from "@/lib/authRider";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Address from "@/models/Address";
import User from "@/models/User";
import { getUserRole } from "@/lib/userRoleCache";
import {
    createRiderAssignmentTrackingEvent,
    createSellerStatusNotification,
    createStatusNotification,
    createStatusTrackingEvent,
} from "@/lib/orderTracking";
import { notifyUsers } from "@/lib/notifyUsers";
import { serializeRiderDelivery } from "@/lib/orderSerialization";
import {
    ACTIVE_ORDER_STATUSES,
    ORDER_STATUSES,
    RIDER_ASSIGNMENT_STATUSES,
    normalizeOrderStatus,
    normalizeRiderAssignmentStatus,
} from "@/lib/orderLifecycle";
import {
    applyOrderStatusTransition,
    formatShortOrderId,
    respondToRiderAssignment,
} from "@/lib/orderWorkflow";

const getNotification = (title, message) => ({
    type: "order",
    title,
    message,
    read: false,
    date: new Date(),
});

const RIDER_AVAILABILITY_VALUES = new Set(["available", "busy"]);

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isRider = await authRider(userId);
        if (!isRider) {
            return NextResponse.json({ success: false, message: "Unauthorized" });
        }

        await connectDB();
        const role = await getUserRole(userId);
        const riderUser = await User.findById(userId).select("_id name phoneNumber riderAvailability imageUrl").lean();
        const deliveries = await Order.find(role === "admin" ? {} : { riderId: userId })
            .populate({ path: "items.product", model: Product })
            .populate({ path: "address", model: Address })
            .sort({ date: -1 })
            .lean();

        const visibleDeliveries = deliveries.filter((delivery) => {
            const status = normalizeOrderStatus(delivery?.status);
            const assignmentStatus = normalizeRiderAssignmentStatus(delivery?.riderAssignmentStatus, delivery?.riderId);

            if (role === "admin") {
                return ACTIVE_ORDER_STATUSES.has(status)
                    || status === ORDER_STATUSES.DELIVERED
                    || status === ORDER_STATUSES.COMPLETED;
            }

            return assignmentStatus === RIDER_ASSIGNMENT_STATUSES.PENDING
                || assignmentStatus === RIDER_ASSIGNMENT_STATUSES.ACCEPTED
                || status === ORDER_STATUSES.DELIVERED
                || status === ORDER_STATUSES.COMPLETED;
        });

        const sellerIds = [...new Set(visibleDeliveries.map((delivery) => delivery.sellerId).filter(Boolean))];
        const sellers = sellerIds.length
            ? await User.find({ _id: { $in: sellerIds } })
                .select("_id name phoneNumber businessName businessLocation sellerRatingSummary")
                .lean()
            : [];

        const sellerMap = new Map(sellers.map((seller) => [String(seller._id), seller]));

        const deliverySummaries = visibleDeliveries.map((delivery) => {
            const products = delivery.items
                .map((item) => item.product)
                .filter(Boolean);
            const firstProduct = products[0] || null;

            return {
                ...serializeRiderDelivery({
                    order: delivery,
                    seller: sellerMap.get(String(delivery.sellerId)) || null,
                    rider: riderUser,
                    productFallback: firstProduct,
                }),
                deliveryPayout: Number(delivery?.deliveryFee) || 0,
            };
        });

        return NextResponse.json({
            success: true,
            deliveries: deliverySummaries,
            riderAvailability: riderUser?.riderAvailability || "available",
        });
    } catch (error) {
        console.error("Error fetching rider deliveries:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}

export async function PUT(request) {
    try {
        const userId = await getRequestUserId(request);
        const isRider = await authRider(userId);
        if (!isRider) {
            return NextResponse.json({ success: false, message: "Unauthorized" });
        }

        const role = await getUserRole(userId);
        const { orderId, status, assignmentResponse, riderAvailability } = await request.json();

        await connectDB();

        const riderUser = await User.findById(userId).select("_id name phoneNumber riderAvailability imageUrl");
        if (!riderUser) {
            return NextResponse.json({ success: false, message: "Rider account not found" }, { status: 404 });
        }

        if (typeof riderAvailability === "string" && riderAvailability.trim()) {
            const nextAvailability = riderAvailability.trim().toLowerCase();

            if (!RIDER_AVAILABILITY_VALUES.has(nextAvailability)) {
                return NextResponse.json({ success: false, message: "Invalid rider availability" }, { status: 400 });
            }

            if (nextAvailability === "available") {
                const activeAcceptedDeliveries = await Order.countDocuments({
                    riderId: userId,
                    riderAssignmentStatus: RIDER_ASSIGNMENT_STATUSES.ACCEPTED,
                    status: {
                        $in: [
                            ORDER_STATUSES.ACCEPTED,
                            ORDER_STATUSES.PROCESSING,
                            ORDER_STATUSES.READY,
                            ORDER_STATUSES.OUT_FOR_DELIVERY,
                        ],
                    },
                });

                if (activeAcceptedDeliveries > 0) {
                    return NextResponse.json({
                        success: false,
                        message: "Finish or hand off your active delivery before marking yourself available.",
                    }, { status: 400 });
                }
            }

            if (riderUser.riderAvailability !== nextAvailability) {
                riderUser.riderAvailability = nextAvailability;
                await riderUser.save();
            }

            return NextResponse.json({
                success: true,
                message: nextAvailability === "busy"
                    ? "You are now marked busy"
                    : "You are now marked available",
                riderAvailability: riderUser.riderAvailability || nextAvailability,
            });
        }

        if (!orderId) {
            return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        if (role !== "admin" && String(order.riderId || "") !== userId) {
            return NextResponse.json({ success: false, message: "This delivery is not assigned to you" }, { status: 403 });
        }

        const outboundNotifications = [];
        const touchedDocs = [];
        const updatedFields = [];

        if (typeof assignmentResponse === "string" && assignmentResponse.trim()) {
            const responseResult = respondToRiderAssignment({
                order,
                response: assignmentResponse,
            });

            if (responseResult.changed) {
                if (assignmentResponse.trim().toUpperCase() === "ACCEPT" && riderUser) {
                    riderUser.riderAvailability = "busy";
                    touchedDocs.push(riderUser);
                    order.trackingEvents = [
                        ...(order.trackingEvents || []),
                        createRiderAssignmentTrackingEvent({ accepted: true }),
                    ];
                    outboundNotifications.push({
                        userId: order.userId,
                        notification: getNotification(
                            "Rider accepted delivery",
                            `Order #${formatShortOrderId(order._id)} now has a confirmed rider.`
                        ),
                        emailTitle: `Rider accepted delivery: #${formatShortOrderId(order._id)}`,
                        emailMessage: `Your assigned rider accepted delivery for order #${formatShortOrderId(order._id)}.`,
                        ctaLabel: "Track order",
                        ctaPath: "/my-orders",
                    });
                    if (order.sellerId) {
                        outboundNotifications.push({
                            userId: order.sellerId,
                            notification: getNotification(
                                "Rider accepted delivery",
                                `Order #${formatShortOrderId(order._id)} now has a confirmed rider.`
                            ),
                            emailTitle: `Rider accepted delivery: #${formatShortOrderId(order._id)}`,
                            emailMessage: `The assigned rider accepted delivery for order #${formatShortOrderId(order._id)}. Open your seller dashboard to prepare the handoff.`,
                            ctaLabel: "Open seller orders",
                            ctaPath: "/seller/orders",
                        });
                    }
                }

                if (assignmentResponse.trim().toUpperCase() === "DECLINE") {
                    if (riderUser) {
                        riderUser.riderAvailability = "available";
                        touchedDocs.push(riderUser);
                    }

                    order.trackingEvents = [
                        ...(order.trackingEvents || []),
                        createRiderAssignmentTrackingEvent({ declined: true }),
                    ];
                    outboundNotifications.push({
                        userId: order.sellerId,
                        notification: getNotification(
                            "Rider declined assignment",
                            `Order #${formatShortOrderId(order._id)} needs a new rider assignment.`
                        ),
                        emailTitle: `Rider declined assignment: #${formatShortOrderId(order._id)}`,
                        emailMessage: `The assigned rider declined order #${formatShortOrderId(order._id)}. Reassign a rider from the seller dashboard.`,
                        ctaLabel: "Open seller orders",
                        ctaPath: "/seller/orders",
                    });
                    outboundNotifications.push({
                        userId: order.userId,
                        notification: getNotification(
                            "Delivery reassignment needed",
                            `Order #${formatShortOrderId(order._id)} is waiting for a new rider assignment.`
                        ),
                        emailTitle: `Delivery reassignment needed: #${formatShortOrderId(order._id)}`,
                        emailMessage: `Your order #${formatShortOrderId(order._id)} is waiting for a new rider after the last rider declined the delivery.`,
                        ctaLabel: "Track order",
                        ctaPath: "/my-orders",
                    });
                }

                updatedFields.push("assignment");
            }
        }

        if (typeof status === "string" && status.trim()) {
            const transition = applyOrderStatusTransition({
                order,
                nextStatus: status,
                actorRole: "rider",
            });

            if (transition.changed) {
                order.trackingEvents = [
                    ...(order.trackingEvents || []),
                    createStatusTrackingEvent(transition.nextStatus),
                ];

                if (transition.nextStatus === ORDER_STATUSES.DELIVERED && riderUser) {
                    riderUser.riderAvailability = "available";
                    touchedDocs.push(riderUser);
                }

                const customerNotification = createStatusNotification(transition.nextStatus, order._id);
                outboundNotifications.push({
                    userId: order.userId,
                    notification: customerNotification,
                    emailTitle: customerNotification.title,
                    emailMessage: customerNotification.message,
                    ctaLabel: "Track order",
                    ctaPath: "/my-orders",
                    emailDetails: [
                        { label: "order_id", value: `#${formatShortOrderId(order._id)}` },
                        { label: "status", value: transition.nextStatus },
                    ],
                });

                if (order.sellerId && order.sellerId !== userId) {
                    const sellerNotification = createSellerStatusNotification(transition.nextStatus, order._id);
                    outboundNotifications.push({
                        userId: order.sellerId,
                        notification: sellerNotification,
                        emailTitle: sellerNotification.title,
                        emailMessage: sellerNotification.message,
                        ctaLabel: "Open seller orders",
                        ctaPath: "/seller/orders",
                        emailDetails: [
                            { label: "order_id", value: `#${formatShortOrderId(order._id)}` },
                            { label: "status", value: transition.nextStatus },
                        ],
                    });
                }

                updatedFields.push("status");
            }
        }

        if (updatedFields.length === 0) {
            return NextResponse.json({ success: true, message: "No delivery changes were made" });
        }

        await Promise.all([
            order.save(),
            ...touchedDocs.map((doc) => doc.save()),
        ]);

        if (outboundNotifications.length > 0) {
            await notifyUsers(outboundNotifications);
        }

        return NextResponse.json({
            success: true,
            message: updatedFields.includes("status")
                ? `Marked as ${normalizeOrderStatus(order.status)}`
                : assignmentResponse.trim().toUpperCase() === "ACCEPT"
                    ? "Delivery accepted"
                    : "Delivery declined",
        });
    } catch (error) {
        console.error("Error updating rider delivery:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}

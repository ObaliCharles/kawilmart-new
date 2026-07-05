import { getRequestUserId } from "@/lib/requestAuth";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Address from "@/models/Address";
import User from "@/models/User";
import { getUserRole } from "@/lib/userRoleCache";
import {
    createAssignmentNotification,
    createRiderAssignmentTrackingEvent,
    createSellerStatusNotification,
    createStatusNotification,
    createStatusTrackingEvent,
} from "@/lib/orderTracking";
import { notifyUsers } from "@/lib/notifyUsers";
import { serializeAdminOrder } from "@/lib/orderSerialization";
import { RIDER_ASSIGNMENT_STATUSES } from "@/lib/orderLifecycle";
import {
    applyOrderStatusTransition,
    assignRiderToOrder,
    formatShortOrderId,
} from "@/lib/orderWorkflow";

const getNotification = (title, message) => ({
    type: "order",
    title,
    message,
    read: false,
    date: new Date(),
});

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" });
        }

        await connectDB();
        const orders = await Order.find({})
            .populate({ path: "items.product", model: Product })
            .populate({ path: "address", model: Address })
            .sort({ date: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            orders: orders.map((order) => serializeAdminOrder(order)),
        });
    } catch (error) {
        console.error("Error fetching admin orders:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}

export async function PUT(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" });
        }

        const { orderId, status, riderId } = await request.json();
        if (!orderId) {
            return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
        }

        await connectDB();

        const order = await Order.findById(orderId)
            .populate({ path: "items.product", model: Product })
            .populate({ path: "address", model: Address });
        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        const previousRiderId = order.riderId || "";
        const previousAssignmentStatus = order.riderAssignmentStatus;
        const customerNotifications = [];
        const outboundNotifications = [];
        const touchedDocs = [];
        const updatedFields = [];

        if (typeof status === "string" && status.trim()) {
            const transition = applyOrderStatusTransition({
                order,
                nextStatus: status,
                actorRole: "admin",
            });

            if (transition.changed) {
                order.trackingEvents = [
                    ...(order.trackingEvents || []),
                    createStatusTrackingEvent(transition.nextStatus),
                ];
                customerNotifications.push(createStatusNotification(transition.nextStatus, order._id));

                if (order.sellerId) {
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

                if ([ "FAILED", "CANCELLED" ].includes(transition.nextStatus) && order.riderId) {
                    outboundNotifications.push({
                        userId: order.riderId,
                        notification: getNotification(
                            transition.nextStatus === "CANCELLED" ? "Delivery cancelled" : "Delivery closed",
                            `Order #${formatShortOrderId(order._id)} is no longer active for delivery.`
                        ),
                        emailTitle: `${transition.nextStatus === "CANCELLED" ? "Delivery cancelled" : "Delivery closed"}: #${formatShortOrderId(order._id)}`,
                        emailMessage: `Order #${formatShortOrderId(order._id)} is no longer active for delivery after an admin update.`,
                        ctaLabel: "Open rider dashboard",
                        ctaPath: "/dashboard/rider",
                    });
                }

                if (transition.nextStatus === "FAILED" && order.riderId && previousAssignmentStatus === RIDER_ASSIGNMENT_STATUSES.ACCEPTED) {
                    const riderUser = await User.findById(order.riderId).select("_id riderAvailability");
                    if (riderUser) {
                        riderUser.riderAvailability = "available";
                        touchedDocs.push(riderUser);
                    }
                }

                updatedFields.push("status");
            }
        }

        if (riderId !== undefined) {
            const nextRiderId = String(riderId || "").trim();

            if (nextRiderId) {
                const riderRole = await getUserRole(nextRiderId);
                if (riderRole !== "rider" && riderRole !== "admin") {
                    return NextResponse.json({ success: false, message: "Selected user is not a rider" }, { status: 400 });
                }

                const riderUser = await User.findById(nextRiderId).select("_id name phoneNumber riderAvailability imageUrl");
                if (!riderUser) {
                    return NextResponse.json({ success: false, message: "Selected rider is unavailable" }, { status: 400 });
                }

                if (riderUser.riderAvailability === "busy" && nextRiderId !== previousRiderId) {
                    return NextResponse.json({ success: false, message: "Selected rider is currently busy" }, { status: 400 });
                }

                const assignmentResult = assignRiderToOrder({ order, riderId: nextRiderId });
                if (assignmentResult.changed) {
                    if (previousRiderId && previousRiderId !== nextRiderId && previousAssignmentStatus === RIDER_ASSIGNMENT_STATUSES.ACCEPTED) {
                        const previousRiderUser = await User.findById(previousRiderId).select("_id riderAvailability");
                        if (previousRiderUser) {
                            previousRiderUser.riderAvailability = "available";
                            touchedDocs.push(previousRiderUser);
                        }
                    }

                    if (previousRiderId && previousRiderId !== nextRiderId) {
                        outboundNotifications.push({
                            userId: previousRiderId,
                            notification: getNotification(
                                "Delivery reassigned",
                                `Order #${formatShortOrderId(order._id)} is no longer assigned to you.`
                            ),
                            emailTitle: `Delivery reassigned: #${formatShortOrderId(order._id)}`,
                            emailMessage: `Order #${formatShortOrderId(order._id)} was reassigned to another rider by an admin.`,
                            ctaLabel: "Open rider dashboard",
                            ctaPath: "/dashboard/rider",
                        });
                    }

                    const shortOrderId = formatShortOrderId(order._id);
                    outboundNotifications.push({
                        userId: nextRiderId,
                        notification: getNotification(
                            "New delivery assigned",
                            `Order #${shortOrderId} has been assigned to you.`
                        ),
                        emailTitle: `New delivery assigned: #${shortOrderId}`,
                        emailMessage: `Order #${shortOrderId} has been assigned to you for delivery. Open your rider dashboard to accept or decline it.`,
                        ctaLabel: "Open rider dashboard",
                        ctaPath: "/dashboard/rider",
                    });

                    order.trackingEvents = [
                        ...(order.trackingEvents || []),
                        createRiderAssignmentTrackingEvent({ assigned: true }),
                    ];
                    customerNotifications.push(createAssignmentNotification(order._id, true));
                    updatedFields.push("rider");
                }
            } else {
                const assignmentResult = assignRiderToOrder({ order, riderId: "" });
                if (assignmentResult.changed) {
                    if (previousRiderId && previousAssignmentStatus === RIDER_ASSIGNMENT_STATUSES.ACCEPTED) {
                        const previousRiderUser = await User.findById(previousRiderId).select("_id riderAvailability");
                        if (previousRiderUser) {
                            previousRiderUser.riderAvailability = "available";
                            touchedDocs.push(previousRiderUser);
                        }
                    }

                    if (previousRiderId) {
                        outboundNotifications.push({
                            userId: previousRiderId,
                            notification: getNotification(
                                "Delivery removed",
                                `Order #${formatShortOrderId(order._id)} is no longer assigned to you.`
                            ),
                            emailTitle: `Delivery removed: #${formatShortOrderId(order._id)}`,
                            emailMessage: `Order #${formatShortOrderId(order._id)} was removed from your delivery queue by an admin.`,
                            ctaLabel: "Open rider dashboard",
                            ctaPath: "/dashboard/rider",
                        });
                    }

                    order.trackingEvents = [
                        ...(order.trackingEvents || []),
                        createRiderAssignmentTrackingEvent({ assigned: false }),
                    ];
                    customerNotifications.push(createAssignmentNotification(order._id, false));
                    updatedFields.push("rider");
                }
            }
        }

        if (updatedFields.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No order changes were made",
                order: serializeAdminOrder(order.toObject()),
            });
        }

        await Promise.all([
            order.save(),
            ...touchedDocs.map((doc) => doc.save()),
        ]);

        if (customerNotifications.length > 0) {
            outboundNotifications.push(
                ...customerNotifications.map((notification) => ({
                    userId: order.userId,
                    notification,
                    emailTitle: notification.title,
                    emailMessage: notification.message,
                    ctaLabel: "Track order",
                    ctaPath: "/my-orders",
                }))
            );
        }

        if (outboundNotifications.length > 0) {
            await notifyUsers(outboundNotifications);
        }

        const orderForResponse = await Order.findById(order._id)
            .populate({ path: "items.product", model: Product })
            .populate({ path: "address", model: Address })
            .lean();

        return NextResponse.json({ success: true, message: "Order updated", order: serializeAdminOrder(orderForResponse) });
    } catch (error) {
        console.error("Error updating admin order:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}

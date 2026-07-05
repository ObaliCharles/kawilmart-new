import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { getRequestUserId } from "@/lib/requestAuth";
import Order from "@/models/Order";
import User from "@/models/User";
import {
    ORDER_STATUSES,
    canCustomerConfirmOrder,
    canCustomerReviewSeller,
} from "@/lib/orderLifecycle";
import {
    createSellerStatusNotification,
    createStatusTrackingEvent,
} from "@/lib/orderTracking";
import { notifyUsers } from "@/lib/notifyUsers";
import {
    applyOrderStatusTransition,
    applySellerReview,
    formatShortOrderId,
} from "@/lib/orderWorkflow";

const getNotification = (title, message) => ({
    type: "order",
    title,
    message,
    read: false,
    date: new Date(),
});

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { orderId, action, review } = await request.json();
        if (!orderId || !action) {
            return NextResponse.json({ success: false, message: "Order ID and action are required" }, { status: 400 });
        }

        await connectDB();

        const order = await Order.findOne({ _id: orderId, userId });
        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        if (action === "CONFIRM_DELIVERY") {
            if (!canCustomerConfirmOrder(order)) {
                return NextResponse.json({ success: false, message: "This order cannot be confirmed yet" }, { status: 400 });
            }

            const transition = applyOrderStatusTransition({
                order,
                nextStatus: ORDER_STATUSES.COMPLETED,
                actorRole: "customer",
            });

            if (transition.changed) {
                order.trackingEvents = [
                    ...(order.trackingEvents || []),
                    createStatusTrackingEvent(transition.nextStatus),
                ];
                await order.save();

                const outboundNotifications = [];

                if (order.sellerId) {
                    const sellerNotification = createSellerStatusNotification(transition.nextStatus, order._id);
                    outboundNotifications.push({
                        userId: order.sellerId,
                        notification: sellerNotification,
                        emailTitle: sellerNotification.title,
                        emailMessage: sellerNotification.message,
                        ctaLabel: "Open seller orders",
                        ctaPath: "/seller/orders",
                    });
                }

                if (order.riderId) {
                    outboundNotifications.push({
                        userId: order.riderId,
                        notification: getNotification(
                            "Delivery confirmed",
                            `Customer confirmed order #${formatShortOrderId(order._id)} as received.`
                        ),
                        emailTitle: `Delivery confirmed: #${formatShortOrderId(order._id)}`,
                        emailMessage: `The customer confirmed receipt of order #${formatShortOrderId(order._id)}.`,
                        ctaLabel: "Open rider dashboard",
                        ctaPath: "/dashboard/rider",
                    });
                }

                if (outboundNotifications.length > 0) {
                    await notifyUsers(outboundNotifications);
                }
            }

            return NextResponse.json({ success: true, message: "Delivery confirmed successfully" });
        }

        if (action === "SUBMIT_SELLER_REVIEW") {
            if (!canCustomerReviewSeller(order)) {
                return NextResponse.json({ success: false, message: "You can only review completed orders once" }, { status: 400 });
            }

            const [seller, reviewer] = await Promise.all([
                User.findById(order.sellerId),
                User.findById(userId).select("_id name"),
            ]);

            if (!seller) {
                return NextResponse.json({ success: false, message: "Seller profile not found" }, { status: 404 });
            }

            applySellerReview({
                order,
                seller,
                reviewerId: userId,
                reviewerName: reviewer?.name || "Customer",
                review,
            });

            await Promise.all([
                order.save(),
                seller.save(),
            ]);

            await notifyUsers([{
                userId: order.sellerId,
                notification: getNotification(
                    "New seller review",
                    `A customer rated order #${formatShortOrderId(order._id)}.`
                ),
                emailTitle: `New seller review: #${formatShortOrderId(order._id)}`,
                emailMessage: `A customer submitted a seller review for order #${formatShortOrderId(order._id)}.`,
                ctaLabel: "Open seller dashboard",
                ctaPath: "/seller",
            }]);

            return NextResponse.json({ success: true, message: "Seller review submitted successfully" });
        }

        return NextResponse.json({ success: false, message: "Unsupported customer action" }, { status: 400 });
    } catch (error) {
        console.error("Error processing customer order action:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

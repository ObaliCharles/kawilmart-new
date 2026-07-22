import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Order from "@/models/Order";
import { PAYMENT_STATUSES } from "@/lib/orderLifecycle";
import { getRequestUserId } from "@/lib/requestAuth";
import { getActiveGateway } from "@/lib/payments";
import { settleTransaction } from "@/lib/paymentSettlement";

// Called by the order-placed page when a shopper returns from the hosted
// payment page. Gateway callbacks can be delayed, retried or dropped entirely —
// Pesapal's IPN especially — so rather than trusting it to arrive we re-verify
// here too. Settlement is idempotent, so whichever path lands first wins and
// the other becomes a no-op.
export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reference = (searchParams.get("reference") || "").trim();
        // Pesapal appends its own tracking id to the callback URL.
        const trackingId = (searchParams.get("trackingId") || "").trim();

        if (!reference) {
            return NextResponse.json({ success: false, message: "Missing reference" }, { status: 400 });
        }

        await connectDB();

        // Scoped to this shopper so a reference cannot be used to probe
        // somebody else's order state.
        let orders = await Order.find({ userId, paymentReference: reference })
            .select("paymentStatus paymentTransactionId amount")
            .lean();

        if (orders.length === 0) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        const stillPending = orders.some((order) => order.paymentStatus === PAYMENT_STATUSES.PENDING);
        const gateway = getActiveGateway();
        const resolvedTrackingId = trackingId || orders.find((order) => order.paymentTransactionId)?.paymentTransactionId;

        if (stillPending && gateway && resolvedTrackingId) {
            await settleTransaction({
                gateway,
                transactionId: resolvedTrackingId,
                fallbackReference: reference,
            }).catch((error) => {
                // A verification hiccup should not break the return page; the
                // webhook remains the primary path.
                console.error("Return-page settlement failed:", error);
            });

            orders = await Order.find({ userId, paymentReference: reference })
                .select("paymentStatus amount")
                .lean();
        }

        const paid = orders.every((order) => order.paymentStatus === PAYMENT_STATUSES.PAID);
        const failed = orders.every((order) => order.paymentStatus === PAYMENT_STATUSES.FAILED);

        return NextResponse.json({
            success: true,
            paymentStatus: paid ? "paid" : failed ? "failed" : "pending",
            orderCount: orders.length,
        });
    } catch (error) {
        console.error("Payment status error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Order from "@/models/Order";
import { PAYMENT_STATUSES } from "@/lib/orderLifecycle";
import { getRequestUserId } from "@/lib/requestAuth";
import { getActiveGateway } from "@/lib/payments";
import { settleTransaction } from "@/lib/paymentSettlement";

// Called by the order-placed page when a shopper returns from the hosted
// payment page. Gateway callbacks can be delayed, retried or dropped entirely,
// so rather than trusting one to arrive we re-verify here too. Settlement is
// idempotent, so whichever path lands first wins and the other becomes a no-op.
export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reference = (searchParams.get("reference") || "").trim();
        // Whatever transaction handle the gateway appended to the callback URL
        // (Flutterwave's transaction_id, Pesapal's OrderTrackingId).
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
        const resolvedTrackingId = trackingId || orders.find((order) => order.paymentTransactionId)?.paymentTransactionId || "";
        // Flutterwave mints no transaction id until the shopper pays, so with no
        // id yet we still settle by our own reference rather than waiting on the
        // webhook. settleTransaction picks whichever handle the gateway supports.
        const canSettle = Boolean(resolvedTrackingId) || Boolean(gateway?.verifyByReference);

        if (stillPending && gateway && canSettle) {
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

import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { PAYMENT_STATUSES, PAYMENT_METHOD_LABELS } from "@/lib/orderLifecycle";
import { createPaymentTrackingEvent, createSellerOrderPlacedNotification } from "@/lib/orderTracking";
import { notifyUsers } from "@/lib/notifyUsers";
import { PAYMENT_RESULT_STATUSES } from "@/lib/payments";

// Settlement is shared by the gateway webhook and the return-page status check.
// Both need identical behaviour: if a gateway's callback is delayed or lost,
// the shopper coming back from the hosted page still settles the order rather
// than leaving it Pending with stock held indefinitely.

const formatCurrency = (amount) => `UGX ${Number(amount || 0).toLocaleString("en-UG")}`;

// Releases a paid checkout: marks every seller-order Paid, empties the cart and
// sends the confirmations that a COD order sends at creation time.
export const confirmPaidOrders = async (orders, transactionId) => {
    const paidAt = new Date();
    const userId = orders[0].userId;
    const totalAmount = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const totalItems = orders.reduce(
        (sum, order) => sum + order.items.reduce((orderSum, item) => orderSum + (item.quantity || 0), 0),
        0
    );

    await Promise.all(orders.map(async (order) => {
        order.paymentStatus = PAYMENT_STATUSES.PAID;
        order.paymentPaidAt = paidAt;
        order.paymentTransactionId = transactionId;
        order.trackingEvents.push(createPaymentTrackingEvent(PAYMENT_STATUSES.PAID, paidAt));
        await order.save();
    }));

    await User.findByIdAndUpdate(userId, { $set: { cartItems: {} } });

    const customerEntry = {
        userId,
        notification: {
            type: "order",
            title: orders.length > 1 ? "Payment received - orders placed" : "Payment received - order placed",
            message: `We received your payment of ${formatCurrency(totalAmount)} for ${totalItems} item${totalItems === 1 ? "" : "s"}.`,
            read: false,
            date: paidAt,
        },
        emailTitle: "Your KawilMart payment was received",
        emailMessage: `Your payment of ${formatCurrency(totalAmount)} went through and your order for ${totalItems} item${totalItems === 1 ? "" : "s"} is confirmed. You can track progress from your orders page.`,
        ctaLabel: "Track my order",
        ctaPath: "/my-orders",
        emailDetails: [
            { label: "orders", value: String(orders.length) },
            { label: "items", value: String(totalItems) },
            { label: "payment", value: PAYMENT_METHOD_LABELS[orders[0].paymentMethod] || orders[0].paymentMethod },
            { label: "total", value: formatCurrency(totalAmount) },
        ],
    };

    const sellerEntries = orders
        .filter((order) => order?.sellerId)
        .map((order) => {
            const sellerItemCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const shortOrderId = String(order._id).slice(-8).toUpperCase();
            const sellerTotal = formatCurrency(order.amount);

            return {
                userId: order.sellerId,
                notification: createSellerOrderPlacedNotification({
                    orderId: order._id,
                    customerName: "A customer",
                    totalItems: sellerItemCount,
                    totalAmount: sellerTotal,
                }),
                emailTitle: `New paid order: #${shortOrderId}`,
                emailMessage: `Order #${shortOrderId} for ${sellerItemCount} item${sellerItemCount === 1 ? "" : "s"} totaling ${sellerTotal} has been paid for online. Open your seller dashboard to fulfil it.`,
                ctaLabel: "Open seller orders",
                ctaPath: "/seller/orders",
                emailDetails: [
                    { label: "order_id", value: `#${shortOrderId}` },
                    { label: "items", value: String(sellerItemCount) },
                    { label: "total", value: sellerTotal },
                    { label: "payment", value: "Paid online" },
                ],
            };
        });

    await notifyUsers([customerEntry, ...sellerEntries]);
};

// Voids an abandoned or declined checkout and puts the reserved stock back.
export const failOrders = async (orders, transactionId) => {
    const failedAt = new Date();

    await Promise.all(orders.map(async (order) => {
        order.paymentStatus = PAYMENT_STATUSES.FAILED;
        order.paymentTransactionId = transactionId;
        order.trackingEvents.push(createPaymentTrackingEvent(PAYMENT_STATUSES.FAILED, failedAt));
        await order.save();
    }));

    await Promise.allSettled(
        orders.flatMap((order) => order.items.map((item) =>
            Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
        ))
    );

    await notifyUsers([{
        userId: orders[0].userId,
        notification: {
            type: "order",
            title: "Payment was not completed",
            message: "We could not confirm your payment, so the order was not placed. Your items are still available.",
            read: false,
            date: failedAt,
        },
        emailTitle: "Your KawilMart payment did not go through",
        emailMessage: "We could not confirm your mobile money payment, so the order was not placed and you have not been charged. Your items are still available if you would like to try again.",
        ctaLabel: "Return to cart",
        ctaPath: "/cart",
    }]);
};

// Verifies a transaction with the gateway and applies the outcome exactly once.
// Safe to call repeatedly and concurrently from webhook and return page.
export const settleTransaction = async ({ gateway, transactionId, fallbackReference = "" }) => {
    const verified = await gateway.verify(transactionId);
    const reference = verified.reference || fallbackReference;

    if (!reference) {
        return { outcome: "no-reference" };
    }

    await connectDB();
    const orders = await Order.find({ paymentReference: reference });

    if (orders.length === 0) {
        return { outcome: "no-orders", reference };
    }

    if (orders.every((order) => order.paymentStatus !== PAYMENT_STATUSES.PENDING)) {
        const paid = orders.every((order) => order.paymentStatus === PAYMENT_STATUSES.PAID);
        return { outcome: paid ? "already-paid" : "already-failed", reference };
    }

    if (verified.status === PAYMENT_RESULT_STATUSES.PENDING) {
        return { outcome: "pending", reference };
    }

    if (verified.status === PAYMENT_RESULT_STATUSES.PAID) {
        const expectedTotal = orders.reduce((sum, order) => sum + (order.amount || 0), 0);

        // Underpayment or a currency mismatch means this is not the payment we
        // asked for — never release goods on it.
        if (verified.amount < expectedTotal || (verified.currency && verified.currency !== "UGX")) {
            console.error(
                `Payment amount mismatch for ${reference}: got ${verified.amount} ${verified.currency}, expected ${expectedTotal} UGX`
            );
            return { outcome: "amount-mismatch", reference };
        }

        await confirmPaidOrders(orders, verified.transactionId);
        return { outcome: "paid", reference };
    }

    await failOrders(orders, verified.transactionId);
    return { outcome: "failed", reference };
};

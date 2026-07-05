import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import { notifyUsers } from "@/lib/notifyUsers";
import {
    buildSellerInvoiceNotificationPayload,
    buildSellerInvoicePayload,
    getBillingPeriodFromKey,
    getCommissionStatusForInvoice,
    getPreviousBillingPeriod,
    serializeBillingInvoice,
} from "@/lib/billingInvoices";
import BillingInvoice from "@/models/BillingInvoice";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

const FROZEN_INVOICE_STATUSES = new Set(["paid", "void"]);

const toUniqueIds = (values = []) => (
    [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
);

const getDatabaseSellerIds = async () => {
    await connectDB();

    const [productSellerIds, orderSellerIds, invoicedSellerIds] = await Promise.all([
        Product.distinct("userId", { userId: { $exists: true, $nin: ["", null] } }),
        Order.distinct("sellerId", { sellerId: { $exists: true, $nin: ["", null] } }),
        BillingInvoice.distinct("sellerId", { sellerId: { $exists: true, $nin: ["", null] } }),
    ]);

    return toUniqueIds([
        ...productSellerIds,
        ...orderSellerIds,
        ...invoicedSellerIds,
    ]);
};

export const getSellerRoleIds = async () => {
    const sellerIds = new Set();
    const databaseSellerIds = await getDatabaseSellerIds();
    databaseSellerIds.forEach((id) => sellerIds.add(id));

    try {
        const client = await clerkClient();
        const limit = 100;
        let offset = 0;
        let totalCount = limit;

        while (offset < totalCount) {
            const clerkUsers = await client.users.getUserList({ limit, offset });
            const users = clerkUsers?.data || [];
            totalCount = Number(clerkUsers?.totalCount) || users.length;

            users
                .filter((user) => (user.publicMetadata?.role || user.metadata?.role) === "seller")
                .map((user) => user.id)
                .filter(Boolean)
                .forEach((id) => sellerIds.add(id));

            if (!users.length || users.length < limit) {
                break;
            }

            offset += users.length;
        }
    } catch (error) {
        console.error("Falling back to database seller discovery for invoice generation:", error);
    }

    return [...sellerIds];
};

export const generateSellerInvoicesForPeriod = async ({
    periodKey = "",
    generatedBy = "system",
    sendNotifications = true,
    sellerIds = [],
    now = new Date(),
} = {}) => {
    const resolvedPeriod = periodKey
        ? getBillingPeriodFromKey(periodKey)
        : getPreviousBillingPeriod(now);

    if (!resolvedPeriod) {
        throw new Error("Invalid billing period");
    }

    const sellerRoleIds = sellerIds.length ? sellerIds : await getSellerRoleIds();
    if (!sellerRoleIds.length) {
        return {
            periodKey: resolvedPeriod.key,
            invoices: [],
            createdCount: 0,
            updatedCount: 0,
            skippedCount: 0,
        };
    }

    await connectDB();

    const [sellers, orders, existingInvoices] = await Promise.all([
        User.find({ _id: { $in: sellerRoleIds } }).lean(),
        Order.find({ sellerId: { $in: sellerRoleIds } })
            .select("_id sellerId subtotal commissionAmount commissionRate status customerConfirmedAt date")
            .lean(),
        BillingInvoice.find({ sellerId: { $in: sellerRoleIds }, periodKey: resolvedPeriod.key }),
    ]);

    const ordersBySeller = orders.reduce((acc, order) => {
        const sellerId = String(order?.sellerId || "");
        if (!sellerId) {
            return acc;
        }

        if (!acc[sellerId]) {
            acc[sellerId] = [];
        }

        acc[sellerId].push(order);
        return acc;
    }, {});

    const existingBySeller = new Map(existingInvoices.map((invoice) => [String(invoice.sellerId), invoice]));
    const generatedInvoices = [];
    const notificationEntries = [];
    const touchedOrderIds = new Set();
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const seller of sellers) {
        const sellerId = String(seller?._id || "");
        const sellerOrders = ordersBySeller[sellerId] || [];
        const existingInvoice = existingBySeller.get(sellerId) || null;

        if (existingInvoice && FROZEN_INVOICE_STATUSES.has(existingInvoice.status)) {
            skippedCount += 1;
            generatedInvoices.push(existingInvoice);
            continue;
        }

        const payload = buildSellerInvoicePayload({
            seller,
            orders: sellerOrders,
            period: resolvedPeriod,
            generatedBy,
            issuedAt: now,
            existingInvoice,
        });

        if (!payload.totalDue && payload.orderIds.length === 0 && !payload.subscriptionFee) {
            skippedCount += 1;
            continue;
        }

        const invoice = await BillingInvoice.findOneAndUpdate(
            { sellerId, periodKey: resolvedPeriod.key },
            { $set: payload },
            { new: true, upsert: true }
        );

        payload.orderIds.forEach((orderId) => touchedOrderIds.add(orderId));

        if (existingInvoice) {
            updatedCount += 1;
        } else {
            createdCount += 1;
        }

        generatedInvoices.push(invoice);

        const shouldNotify = sendNotifications && (!existingInvoice || !existingInvoice.sentAt);
        if (shouldNotify) {
            const notification = buildSellerInvoiceNotificationPayload({ invoice, reminder: false });
            notificationEntries.push({
                userId: sellerId,
                notification: {
                    type: "system",
                    title: notification.title,
                    message: notification.message,
                    read: false,
                    date: new Date(),
                },
                emailTitle: notification.emailTitle,
                emailMessage: notification.emailMessage,
                ctaLabel: notification.ctaLabel,
                ctaPath: notification.ctaPath,
            });

            if (!invoice.sentAt) {
                invoice.sentAt = now;
                await invoice.save();
            }
        }
    }

    if (touchedOrderIds.size) {
        await Order.updateMany(
            { _id: { $in: [...touchedOrderIds] } },
            { $set: { commissionStatus: getCommissionStatusForInvoice("issued") } }
        );
    }

    if (notificationEntries.length) {
        await notifyUsers(notificationEntries);
    }

    return {
        periodKey: resolvedPeriod.key,
        invoices: generatedInvoices.map((invoice) => serializeBillingInvoice(invoice)),
        createdCount,
        updatedCount,
        skippedCount,
    };
};

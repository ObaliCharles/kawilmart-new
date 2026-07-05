import "server-only";

import connectDB from "@/config/db";
import BillingInvoice from "@/models/BillingInvoice";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import {
    addDays,
    buildSellerInvoicePayload,
    getBillingPeriodFromKey,
    serializeBillingInvoice,
} from "@/lib/billingInvoices";
import { getCurrentBillingPeriod } from "@/lib/orderLifecycle";
import {
    getSellerAccessState,
    getSellerSubscriptionSnapshot,
} from "@/lib/sellerBilling";

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const toUniqueIds = (values = []) => (
    [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
);

const matchesSearch = (invoice, search = "") => {
    if (!search) {
        return true;
    }

    const normalizedSearch = search.toLowerCase();
    return [
        invoice?.invoiceNumber,
        invoice?.sellerSnapshot?.businessName,
        invoice?.sellerSnapshot?.name,
        invoice?.sellerSnapshot?.email,
    ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
};

const sortBillingRows = (left, right) => {
    const leftOverdue = left?.status === "overdue" ? 1 : 0;
    const rightOverdue = right?.status === "overdue" ? 1 : 0;

    if (rightOverdue !== leftOverdue) {
        return rightOverdue - leftOverdue;
    }

    const rightPeriod = new Date(right?.periodStart || right?.issuedAt || 0).getTime();
    const leftPeriod = new Date(left?.periodStart || left?.issuedAt || 0).getTime();
    if (rightPeriod !== leftPeriod) {
        return rightPeriod - leftPeriod;
    }

    return String(right?.rowId || right?.id || "").localeCompare(String(left?.rowId || left?.id || ""));
};

const getPreviewInvoiceStatus = (seller = {}) => {
    const subscription = getSellerSubscriptionSnapshot(seller);
    return subscription.status === "overdue" ? "overdue" : "issued";
};

const getPreviewDueDate = (seller = {}, now = new Date()) => {
    const subscription = getSellerSubscriptionSnapshot(seller);
    const access = getSellerAccessState(seller, { now });
    const nextBillingDate = subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : null;
    const accessUntil = subscription.accessUntil ? new Date(subscription.accessUntil) : null;

    if (subscription.status === "overdue") {
        if (nextBillingDate && Number.isFinite(nextBillingDate.getTime()) && nextBillingDate.getTime() < now.getTime()) {
            return nextBillingDate;
        }

        if (accessUntil && Number.isFinite(accessUntil.getTime()) && accessUntil.getTime() < now.getTime()) {
            return accessUntil;
        }

        if (!access.hasAccess) {
            return now;
        }
    }

    if (nextBillingDate && Number.isFinite(nextBillingDate.getTime())) {
        return nextBillingDate;
    }

    if (accessUntil && Number.isFinite(accessUntil.getTime())) {
        return accessUntil;
    }

    return addDays(now);
};

const shouldIncludePreview = (invoice = {}, seller = {}) => {
    if (invoice?.status === "overdue") {
        return true;
    }

    if ((Number(invoice?.totalDue) || 0) > 0) {
        return true;
    }

    if ((Number(invoice?.completedOrders) || 0) > 0) {
        return true;
    }

    return (Number(seller?.sellerSubscriptionFee) || 0) > 0;
};

const buildPreviewInvoice = ({
    seller,
    orders = [],
    period,
    now = new Date(),
} = {}) => {
    const previewStatus = getPreviewInvoiceStatus(seller);
    const payload = buildSellerInvoicePayload({
        seller,
        orders,
        period,
        issuedAt: now,
        dueAt: getPreviewDueDate(seller, now),
        existingInvoice: {
            status: previewStatus,
            issuedAt: now,
            dueAt: getPreviewDueDate(seller, now),
        },
        generatedBy: "preview",
    });

    const serialized = serializeBillingInvoice(payload);
    if (!shouldIncludePreview(serialized, seller)) {
        return null;
    }

    return {
        ...serialized,
        rowId: `preview:${serialized.sellerId}:${serialized.periodKey}`,
        isPreview: true,
        source: "preview",
    };
};

const getSellerCandidateIds = async () => {
    await connectDB();

    const [userIds, productSellerIds, orderSellerIds, invoiceSellerIds] = await Promise.all([
        User.distinct("_id", {
            $or: [
                { sellerSubscriptionStatus: { $exists: true, $nin: ["", null] } },
                { businessName: { $exists: true, $nin: ["", null] } },
                { sellerSubscriptionFee: { $gt: 0 } },
                { sellerAccessUntil: { $exists: true, $ne: null } },
            ],
        }),
        Product.distinct("userId", { userId: { $exists: true, $nin: ["", null] } }),
        Order.distinct("sellerId", { sellerId: { $exists: true, $nin: ["", null] } }),
        BillingInvoice.distinct("sellerId", { sellerId: { $exists: true, $nin: ["", null] } }),
    ]);

    return toUniqueIds([
        ...userIds,
        ...productSellerIds,
        ...orderSellerIds,
        ...invoiceSellerIds,
    ]);
};

export const getAdminBillingDataset = async ({
    periodKey = "",
    sellerId = "",
    status = "",
    search = "",
    now = new Date(),
} = {}) => {
    await connectDB();

    const resolvedSellerId = normalizeString(sellerId);
    const resolvedStatus = normalizeString(status);
    const resolvedPeriodKey = normalizeString(periodKey);
    const previewPeriod = resolvedPeriodKey
        ? getBillingPeriodFromKey(resolvedPeriodKey)
        : getCurrentBillingPeriod(now);

    const invoiceQuery = {};
    if (resolvedSellerId) {
        invoiceQuery.sellerId = resolvedSellerId;
    }
    if (resolvedStatus) {
        invoiceQuery.status = resolvedStatus;
    }
    if (resolvedPeriodKey) {
        invoiceQuery.periodKey = resolvedPeriodKey;
    }

    const storedInvoices = await BillingInvoice.find(invoiceQuery)
        .sort({ periodStart: -1, createdAt: -1 })
        .lean();

    const storedRows = storedInvoices
        .map((invoice) => ({
            ...serializeBillingInvoice(invoice),
            rowId: String(invoice?._id || ""),
            isPreview: false,
            source: "stored",
        }))
        .filter((invoice) => matchesSearch(invoice, search));

    const existingInvoiceKeys = new Set(
        storedInvoices.map((invoice) => `${String(invoice?.sellerId || "")}:${String(invoice?.periodKey || "")}`)
    );

    const candidateIds = await getSellerCandidateIds();
    const filteredCandidateIds = resolvedSellerId
        ? candidateIds.filter((candidateId) => candidateId === resolvedSellerId)
        : candidateIds;

    const previewRows = [];

    if (previewPeriod && filteredCandidateIds.length > 0) {
        const [sellers, orders] = await Promise.all([
            User.find({ _id: { $in: filteredCandidateIds } }).lean(),
            Order.find({ sellerId: { $in: filteredCandidateIds } })
                .select("_id sellerId subtotal commissionAmount commissionRate status customerConfirmedAt deliveredAt date")
                .lean(),
        ]);

        const ordersBySeller = orders.reduce((acc, order) => {
            const currentSellerId = String(order?.sellerId || "");
            if (!currentSellerId) {
                return acc;
            }

            if (!acc[currentSellerId]) {
                acc[currentSellerId] = [];
            }

            acc[currentSellerId].push(order);
            return acc;
        }, {});

        sellers.forEach((seller) => {
            const currentSellerId = String(seller?._id || "");
            const previewKey = `${currentSellerId}:${previewPeriod.key}`;

            if (!currentSellerId || existingInvoiceKeys.has(previewKey)) {
                return;
            }

            const previewInvoice = buildPreviewInvoice({
                seller,
                orders: ordersBySeller[currentSellerId] || [],
                period: previewPeriod,
                now,
            });

            if (!previewInvoice) {
                return;
            }

            if (resolvedStatus && previewInvoice.status !== resolvedStatus) {
                return;
            }

            if (!matchesSearch(previewInvoice, search)) {
                return;
            }

            previewRows.push(previewInvoice);
        });
    }

    const invoices = [...storedRows, ...previewRows].sort(sortBillingRows);
    const periodOptions = [...new Set([
        ...storedRows.map((invoice) => invoice.periodKey),
        ...previewRows.map((invoice) => invoice.periodKey),
    ].filter(Boolean))].sort((left, right) => right.localeCompare(left));

    return {
        invoices,
        storedInvoices: storedRows,
        previewInvoices: previewRows,
        periodOptions,
        previewPeriodKey: previewPeriod?.key || "",
    };
};

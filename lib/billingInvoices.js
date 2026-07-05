import {
    COMMISSION_STATUSES,
    getCurrentBillingPeriod,
    getInvoiceNumber,
} from "@/lib/orderLifecycle";
import { buildSellerInvoiceSnapshot, getCompletedSellerOrdersForPeriod } from "@/lib/sellerBilling";

export const SELLER_INVOICE_STATUSES = ["issued", "paid", "overdue", "void"];
export const BILLING_REMINDER_GRACE_DAYS = 7;

const toDate = (value) => {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
};

export const getBillingPeriodFromKey = (periodKey = "") => {
    const [yearToken, monthToken] = String(periodKey || "").split("-");
    const year = Number(yearToken);
    const monthIndex = Number(monthToken) - 1;

    if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        return null;
    }

    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    return {
        start,
        end,
        key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    };
};

export const getPreviousBillingPeriod = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);
    const previousMonthDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return getCurrentBillingPeriod(previousMonthDate);
};

export const formatBillingPeriodLabel = (periodKey = "") => {
    const period = getBillingPeriodFromKey(periodKey);
    if (!period) {
        return periodKey || "Unknown period";
    }

    return period.start.toLocaleDateString("en-UG", {
        year: "numeric",
        month: "long",
    });
};

export const addDays = (value = new Date(), days = BILLING_REMINDER_GRACE_DAYS) => {
    const baseDate = toDate(value) || new Date();
    const next = new Date(baseDate);
    next.setDate(next.getDate() + days);
    return next;
};

export const buildSellerInvoicePayload = ({
    seller = {},
    orders = [],
    period = null,
    generatedBy = "system",
    issuedAt = new Date(),
    dueAt = null,
    existingInvoice = null,
} = {}) => {
    const resolvedPeriod = period || getCurrentBillingPeriod(issuedAt);
    const snapshot = buildSellerInvoiceSnapshot({
        seller,
        orders,
        now: issuedAt,
        period: resolvedPeriod,
    });
    const completedOrders = getCompletedSellerOrdersForPeriod(orders, resolvedPeriod);
    const issueDate = existingInvoice?.issuedAt || issuedAt;
    const dueDate = existingInvoice?.dueAt || dueAt || addDays(issueDate);
    const status = existingInvoice?.status && SELLER_INVOICE_STATUSES.includes(existingInvoice.status)
        ? existingInvoice.status
        : "issued";

    return {
        sellerId: String(seller?._id || seller?.id || ""),
        sellerSnapshot: {
            name: seller?.name || "",
            businessName: seller?.businessName || "",
            email: seller?.email || "",
            businessLocation: seller?.businessLocation || "",
            supportEmail: seller?.sellerSupportEmail || "",
            supportPriority: seller?.sellerSupportPriority || "standard",
        },
        invoiceNumber: getInvoiceNumber({
            sellerId: seller?._id || seller?.id || "",
            periodKey: resolvedPeriod.key,
        }),
        periodKey: resolvedPeriod.key,
        periodStart: resolvedPeriod.start,
        periodEnd: resolvedPeriod.end,
        subscriptionPlan: snapshot.subscriptionPlan,
        subscriptionStatus: snapshot.subscriptionStatus,
        subscriptionFee: snapshot.subscriptionFee,
        commissionRate: snapshot.commissionRate,
        commissionTotal: snapshot.commissionTotal,
        completedOrders: snapshot.completedOrders,
        completedSubtotal: snapshot.completedSubtotal,
        totalDue: snapshot.totalDue,
        orderIds: completedOrders
            .map((order) => String(order?._id || ""))
            .filter(Boolean),
        status,
        issuedAt: issueDate,
        dueAt: dueDate,
        sentAt: existingInvoice?.sentAt || null,
        lastReminderAt: existingInvoice?.lastReminderAt || null,
        paidAt: existingInvoice?.paidAt || null,
        paymentReference: existingInvoice?.paymentReference || "",
        paymentNotes: existingInvoice?.paymentNotes || "",
        notes: existingInvoice?.notes || "",
        generatedBy: existingInvoice?.generatedBy || generatedBy,
        lastCalculatedAt: new Date(),
    };
};

export const serializeBillingInvoice = (invoice = {}) => ({
    id: String(invoice?._id || ""),
    sellerId: String(invoice?.sellerId || ""),
    invoiceNumber: invoice?.invoiceNumber || "",
    periodKey: invoice?.periodKey || "",
    periodLabel: formatBillingPeriodLabel(invoice?.periodKey || ""),
    periodStart: toDate(invoice?.periodStart)?.toISOString() || null,
    periodEnd: toDate(invoice?.periodEnd)?.toISOString() || null,
    subscriptionPlan: invoice?.subscriptionPlan || "standard",
    subscriptionStatus: invoice?.subscriptionStatus || "active",
    subscriptionFee: Number(invoice?.subscriptionFee) || 0,
    commissionRate: Number(invoice?.commissionRate) || 0,
    commissionTotal: Number(invoice?.commissionTotal) || 0,
    completedOrders: Number(invoice?.completedOrders) || 0,
    completedSubtotal: Number(invoice?.completedSubtotal) || 0,
    totalDue: Number(invoice?.totalDue) || 0,
    orderIds: Array.isArray(invoice?.orderIds) ? invoice.orderIds.map(String) : [],
    status: invoice?.status || "issued",
    issuedAt: toDate(invoice?.issuedAt)?.toISOString() || null,
    dueAt: toDate(invoice?.dueAt)?.toISOString() || null,
    sentAt: toDate(invoice?.sentAt)?.toISOString() || null,
    lastReminderAt: toDate(invoice?.lastReminderAt)?.toISOString() || null,
    paidAt: toDate(invoice?.paidAt)?.toISOString() || null,
    paymentReference: invoice?.paymentReference || "",
    paymentNotes: invoice?.paymentNotes || "",
    notes: invoice?.notes || "",
    sellerSnapshot: invoice?.sellerSnapshot || {
        name: "",
        businessName: "",
        email: "",
        businessLocation: "",
        supportEmail: "",
        supportPriority: "standard",
    },
    lastCalculatedAt: toDate(invoice?.lastCalculatedAt)?.toISOString() || null,
});

export const buildSellerInvoiceNotificationPayload = ({
    invoice = {},
    reminder = false,
    markedPaid = false,
    markedOverdue = false,
} = {}) => {
    const serialized = serializeBillingInvoice(invoice);

    if (markedPaid) {
        return {
            title: "Invoice marked paid",
            message: `Invoice ${serialized.invoiceNumber} for ${serialized.periodLabel} has been marked paid.`,
            emailTitle: `KawilMart invoice paid: ${serialized.invoiceNumber}`,
            emailMessage: `Your invoice ${serialized.invoiceNumber} for ${serialized.periodLabel} has been marked paid. Your selling access remains active.`,
            ctaLabel: "Review billing",
            ctaPath: "/seller",
        };
    }

    if (markedOverdue) {
        return {
            title: "Invoice overdue",
            message: `Invoice ${serialized.invoiceNumber} for ${serialized.periodLabel} is now overdue.`,
            emailTitle: `KawilMart invoice overdue: ${serialized.invoiceNumber}`,
            emailMessage: `Your invoice ${serialized.invoiceNumber} for ${serialized.periodLabel} is now overdue. Please clear the balance to keep selling access active.`,
            ctaLabel: "Review billing",
            ctaPath: "/seller",
        };
    }

    return {
        title: reminder ? "Invoice reminder" : "New monthly invoice",
        message: `${serialized.invoiceNumber} for ${serialized.periodLabel} totals UGX ${Number(serialized.totalDue || 0).toLocaleString("en-UG")}.`,
        emailTitle: reminder
            ? `KawilMart invoice reminder: ${serialized.invoiceNumber}`
            : `KawilMart invoice ready: ${serialized.invoiceNumber}`,
        emailMessage: `Invoice ${serialized.invoiceNumber} for ${serialized.periodLabel} is ready. Subscription: UGX ${Number(serialized.subscriptionFee || 0).toLocaleString("en-UG")}. Commission: UGX ${Number(serialized.commissionTotal || 0).toLocaleString("en-UG")}. Total due: UGX ${Number(serialized.totalDue || 0).toLocaleString("en-UG")}.`,
        ctaLabel: "Review billing",
        ctaPath: "/seller",
    };
};

export const getInvoiceSummary = (invoices = []) => ({
    totalInvoices: invoices.length,
    issuedInvoices: invoices.filter((invoice) => invoice.status === "issued").length,
    overdueInvoices: invoices.filter((invoice) => invoice.status === "overdue").length,
    paidInvoices: invoices.filter((invoice) => invoice.status === "paid").length,
    outstandingTotal: invoices
        .filter((invoice) => invoice.status === "issued" || invoice.status === "overdue")
        .reduce((sum, invoice) => sum + (Number(invoice.totalDue) || 0), 0),
    paidTotal: invoices
        .filter((invoice) => invoice.status === "paid")
        .reduce((sum, invoice) => sum + (Number(invoice.totalDue) || 0), 0),
});

export const getCommissionStatusForInvoice = (invoiceStatus = "issued") => {
    if (invoiceStatus === "paid") {
        return COMMISSION_STATUSES.PAID;
    }

    if (invoiceStatus === "void") {
        return COMMISSION_STATUSES.EARNED;
    }

    return COMMISSION_STATUSES.INVOICED;
};

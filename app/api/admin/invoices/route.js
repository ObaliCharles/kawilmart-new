import { NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import connectDB from "@/config/db";
import { getRequestUserId } from "@/lib/requestAuth";
import BillingInvoice from "@/models/BillingInvoice";
import Order from "@/models/Order";
import User from "@/models/User";
import { notifyUsers } from "@/lib/notifyUsers";
import {
    buildSellerInvoiceNotificationPayload,
    formatBillingPeriodLabel,
    getCommissionStatusForInvoice,
    getInvoiceSummary,
    getPreviousBillingPeriod,
    serializeBillingInvoice,
} from "@/lib/billingInvoices";
import { generateSellerInvoicesForPeriod } from "@/lib/sellerInvoiceGeneration";
import { getAdminBillingDataset } from "@/lib/adminBilling";

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const addMonths = (value, months = 1) => {
    const baseDate = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(baseDate.getTime())) {
        return null;
    }

    const next = new Date(baseDate);
    next.setMonth(next.getMonth() + months);
    return next;
};

const invoiceQueryFromParams = (searchParams) => {
    const query = {};
    const status = normalizeString(searchParams.get("status"));
    const sellerId = normalizeString(searchParams.get("sellerId"));
    const periodKey = normalizeString(searchParams.get("periodKey"));

    if (status) {
        query.status = status;
    }

    if (sellerId) {
        query.sellerId = sellerId;
    }

    if (periodKey) {
        query.periodKey = periodKey;
    }

    return query;
};

const applySellerBillingStatusFromInvoice = async (invoice, nextStatus, effectiveDate = new Date()) => {
    if (!invoice?.sellerId) {
        return;
    }

    const seller = await User.findById(invoice.sellerId);
    if (!seller) {
        return;
    }

    if (nextStatus === "paid") {
        const paidAt = effectiveDate instanceof Date ? effectiveDate : new Date(effectiveDate);
        seller.sellerSubscriptionStatus = "active";
        seller.sellerSubscriptionLastPaidAt = paidAt;
        if (!seller.sellerSubscriptionStartedAt) {
            seller.sellerSubscriptionStartedAt = paidAt;
        }
        seller.sellerSubscriptionNextBillingDate = addMonths(paidAt, 1);
        seller.sellerAccessUntil = addMonths(paidAt, 1);
    }

    if (nextStatus === "overdue") {
        seller.sellerSubscriptionStatus = "overdue";
    }

    await seller.save();
};

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = normalizeString(searchParams.get("search")).toLowerCase();
        const status = normalizeString(searchParams.get("status"));
        const sellerId = normalizeString(searchParams.get("sellerId"));
        const periodKey = normalizeString(searchParams.get("periodKey"));
        const dataset = await getAdminBillingDataset({
            search,
            status,
            sellerId,
            periodKey,
            now: new Date(),
        });

        return NextResponse.json({
            success: true,
            invoices: dataset.invoices,
            summary: getInvoiceSummary(dataset.invoices),
            periodOptions: dataset.periodOptions,
            previousPeriodKey: getPreviousBillingPeriod(new Date()).key,
            activePreviewPeriodKey: dataset.previewPeriodKey,
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const {
            action,
            periodKey,
            invoiceId,
            sellerId,
            paymentReference = "",
            paymentNotes = "",
            paidAt,
        } = await request.json();
        const normalizedAction = normalizeString(action);

        if (normalizedAction === "generate_invoices") {
            const generation = await generateSellerInvoicesForPeriod({
                periodKey: normalizeString(periodKey),
                generatedBy: userId,
                sendNotifications: true,
                sellerIds: sellerId ? [normalizeString(sellerId)] : [],
                now: new Date(),
            });

            const generatedCount = generation.createdCount + generation.updatedCount;
            const scopeLabel = sellerId ? "seller invoice" : "seller invoice";

            return NextResponse.json({
                success: true,
                message: generatedCount > 0
                    ? `Generated ${generatedCount} ${scopeLabel}${generatedCount === 1 ? "" : "s"} for ${formatBillingPeriodLabel(generation.periodKey)}.`
                    : `No billable seller invoices were generated for ${formatBillingPeriodLabel(generation.periodKey)}.`,
                ...generation,
            });
        }

        if (!invoiceId) {
            return NextResponse.json({ success: false, message: "Invoice ID is required" }, { status: 400 });
        }

        await connectDB();
        const invoice = await BillingInvoice.findById(invoiceId);
        if (!invoice) {
            return NextResponse.json({ success: false, message: "Invoice not found" }, { status: 404 });
        }

        if (normalizedAction === "send_reminder") {
            const notification = buildSellerInvoiceNotificationPayload({ invoice, reminder: true });
            await notifyUsers([{
                userId: invoice.sellerId,
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
            }]);

            invoice.lastReminderAt = new Date();
            if (!invoice.sentAt) {
                invoice.sentAt = new Date();
            }
            await invoice.save();

            return NextResponse.json({ success: true, message: "Invoice reminder sent", invoice: serializeBillingInvoice(invoice) });
        }

        if (normalizedAction === "mark_paid") {
            const paidDate = paidAt ? new Date(paidAt) : new Date();
            invoice.status = "paid";
            invoice.paidAt = paidDate;
            invoice.paymentReference = normalizeString(paymentReference);
            invoice.paymentNotes = normalizeString(paymentNotes);
            await invoice.save();

            if (invoice.orderIds?.length) {
                await Order.updateMany(
                    { _id: { $in: invoice.orderIds } },
                    { $set: { commissionStatus: getCommissionStatusForInvoice("paid") } }
                );
            }

            await applySellerBillingStatusFromInvoice(invoice, "paid", paidDate);

            const notification = buildSellerInvoiceNotificationPayload({ invoice, markedPaid: true });
            await notifyUsers([{
                userId: invoice.sellerId,
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
            }]);

            return NextResponse.json({ success: true, message: "Invoice marked paid", invoice: serializeBillingInvoice(invoice) });
        }

        if (normalizedAction === "mark_overdue") {
            invoice.status = "overdue";
            await invoice.save();

            if (invoice.orderIds?.length) {
                await Order.updateMany(
                    { _id: { $in: invoice.orderIds } },
                    { $set: { commissionStatus: getCommissionStatusForInvoice("overdue") } }
                );
            }

            await applySellerBillingStatusFromInvoice(invoice, "overdue", new Date());

            const notification = buildSellerInvoiceNotificationPayload({ invoice, markedOverdue: true });
            await notifyUsers([{
                userId: invoice.sellerId,
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
            }]);

            return NextResponse.json({ success: true, message: "Invoice marked overdue", invoice: serializeBillingInvoice(invoice) });
        }

        if (normalizedAction === "void_invoice") {
            invoice.status = "void";
            await invoice.save();

            if (invoice.orderIds?.length) {
                await Order.updateMany(
                    { _id: { $in: invoice.orderIds } },
                    { $set: { commissionStatus: getCommissionStatusForInvoice("void") } }
                );
            }

            return NextResponse.json({ success: true, message: "Invoice voided", invoice: serializeBillingInvoice(invoice) });
        }

        return NextResponse.json({ success: false, message: "Unsupported invoice action" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

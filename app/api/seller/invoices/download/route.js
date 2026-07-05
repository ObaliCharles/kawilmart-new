import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import { getRequestUserId } from "@/lib/requestAuth";
import BillingInvoice from "@/models/BillingInvoice";
import Order from "@/models/Order";
import User from "@/models/User";
import {
    buildSellerInvoicePayload,
    formatBillingPeriodLabel,
    getBillingPeriodFromKey,
    serializeBillingInvoice,
} from "@/lib/billingInvoices";
import { buildSellerInvoiceDocument } from "@/lib/billingDocuments";
import { getCompletedSellerOrdersForPeriod } from "@/lib/sellerBilling";
import { getCurrentBillingPeriod } from "@/lib/orderLifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const buildHtmlResponse = ({ filename, html }) => new NextResponse(html, {
    headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
    },
});

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const periodKey = normalizeString(searchParams.get("periodKey")) || getCurrentBillingPeriod(new Date()).key;
        const period = getBillingPeriodFromKey(periodKey);

        if (!period) {
            return NextResponse.json({ success: false, message: "Invalid billing month" }, { status: 400 });
        }

        await connectDB();

        const existingInvoice = await BillingInvoice.findOne({ sellerId: userId, periodKey }).lean();
        if (existingInvoice) {
            const orders = existingInvoice.orderIds?.length
                ? await Order.find({ _id: { $in: existingInvoice.orderIds } })
                    .select("_id subtotal commissionAmount customerConfirmedAt deliveredAt date status")
                    .sort({ customerConfirmedAt: -1, date: -1 })
                    .lean()
                : [];

            const document = buildSellerInvoiceDocument({
                invoice: serializeBillingInvoice(existingInvoice),
                orders,
                isPreview: false,
            });

            return buildHtmlResponse(document);
        }

        const [seller, sellerOrders] = await Promise.all([
            User.findById(userId).lean(),
            Order.find({ sellerId: userId })
                .select("_id subtotal commissionAmount customerConfirmedAt deliveredAt date status")
                .sort({ customerConfirmedAt: -1, date: -1 })
                .lean(),
        ]);

        if (!seller) {
            return NextResponse.json({ success: false, message: "Seller account not found" }, { status: 404 });
        }

        const previewPayload = buildSellerInvoicePayload({
            seller,
            orders: sellerOrders,
            period,
            generatedBy: userId,
            issuedAt: new Date(),
        });
        const periodOrders = getCompletedSellerOrdersForPeriod(sellerOrders, period);

        if (!previewPayload.subscriptionFee && !previewPayload.totalDue && periodOrders.length === 0) {
            return NextResponse.json({
                success: false,
                message: `No billing activity was found for ${formatBillingPeriodLabel(periodKey)}.`,
            }, { status: 404 });
        }

        const document = buildSellerInvoiceDocument({
            invoice: serializeBillingInvoice(previewPayload),
            orders: periodOrders,
            sellerName: seller.businessName || seller.name || "Seller account",
            isPreview: true,
        });

        return buildHtmlResponse(document);
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import connectDB from "@/config/db";
import { getRequestUserId } from "@/lib/requestAuth";
import BillingInvoice from "@/models/BillingInvoice";
import Order from "@/models/Order";
import {
    formatBillingPeriodLabel,
    serializeBillingInvoice,
} from "@/lib/billingInvoices";
import {
    buildAdminBillingReportDocument,
    buildSellerInvoiceDocument,
} from "@/lib/billingDocuments";
import { getAdminBillingDataset } from "@/lib/adminBilling";

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
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const invoiceId = normalizeString(searchParams.get("invoiceId"));
        const periodKey = normalizeString(searchParams.get("periodKey"));

        await connectDB();

        if (invoiceId) {
            const invoice = await BillingInvoice.findById(invoiceId).lean();
            if (!invoice) {
                return NextResponse.json({ success: false, message: "Invoice not found" }, { status: 404 });
            }

            const orders = invoice.orderIds?.length
                ? await Order.find({ _id: { $in: invoice.orderIds } })
                    .select("_id subtotal commissionAmount customerConfirmedAt deliveredAt date status")
                    .sort({ customerConfirmedAt: -1, date: -1 })
                    .lean()
                : [];

            const document = buildSellerInvoiceDocument({
                invoice: serializeBillingInvoice(invoice),
                orders,
                isPreview: false,
            });

            return buildHtmlResponse(document);
        }

        if (!periodKey) {
            return NextResponse.json({ success: false, message: "Billing month is required" }, { status: 400 });
        }

        const dataset = await getAdminBillingDataset({ periodKey, now: new Date() });
        if (!dataset.invoices.length) {
            return NextResponse.json({
                success: false,
                message: `No generated seller invoices were found for ${formatBillingPeriodLabel(periodKey)}.`,
            }, { status: 404 });
        }

        const document = buildAdminBillingReportDocument({
            periodKey,
            periodLabel: formatBillingPeriodLabel(periodKey),
            invoices: dataset.invoices,
        });

        return buildHtmlResponse(document);
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

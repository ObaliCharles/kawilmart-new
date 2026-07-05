import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import { getRequestUserId } from "@/lib/requestAuth";
import BillingInvoice from "@/models/BillingInvoice";
import { getInvoiceSummary, serializeBillingInvoice } from "@/lib/billingInvoices";

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const invoices = await BillingInvoice.find({ sellerId: userId }).sort({ periodStart: -1, createdAt: -1 }).lean();
        const serializedInvoices = invoices.map((invoice) => serializeBillingInvoice(invoice));

        return NextResponse.json({
            success: true,
            invoices: serializedInvoices,
            summary: getInvoiceSummary(serializedInvoices),
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

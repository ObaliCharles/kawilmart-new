import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import authRider from "@/lib/authRider";
import { getRequestUserId } from "@/lib/requestAuth";
import Order from "@/models/Order";
import User from "@/models/User";
import { buildRiderStatementDocument } from "@/lib/billingDocuments";
import { formatBillingPeriodLabel, getBillingPeriodFromKey } from "@/lib/billingInvoices";
import { getCurrentBillingPeriod } from "@/lib/orderLifecycle";
import {
    buildRiderInvoiceSnapshot,
    getCompletedRiderDeliveriesForPeriod,
} from "@/lib/sellerBilling";

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
        const isRider = await authRider(userId);

        if (!isRider) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const periodKey = normalizeString(searchParams.get("periodKey")) || getCurrentBillingPeriod(new Date()).key;
        const period = getBillingPeriodFromKey(periodKey);

        if (!period) {
            return NextResponse.json({ success: false, message: "Invalid billing month" }, { status: 400 });
        }

        await connectDB();

        const [rider, riderOrders] = await Promise.all([
            User.findById(userId).lean(),
            Order.find({ riderId: userId })
                .select("_id sellerId deliveryFee deliveredAt customerConfirmedAt date status")
                .sort({ deliveredAt: -1, date: -1 })
                .lean(),
        ]);

        if (!rider) {
            return NextResponse.json({ success: false, message: "Rider account not found" }, { status: 404 });
        }

        const periodDeliveries = getCompletedRiderDeliveriesForPeriod(riderOrders, period);
        const sellerIds = [...new Set(periodDeliveries.map((order) => String(order?.sellerId || "")).filter(Boolean))];
        const sellers = sellerIds.length
            ? await User.find({ _id: { $in: sellerIds } }).select("_id name businessName").lean()
            : [];
        const sellerMap = new Map(sellers.map((seller) => [
            String(seller._id),
            seller.businessName || seller.name || "Seller",
        ]));

        const snapshot = buildRiderInvoiceSnapshot({
            rider,
            orders: riderOrders,
            period,
        });

        const document = buildRiderStatementDocument({
            rider,
            snapshot: {
                ...snapshot,
                periodLabel: formatBillingPeriodLabel(periodKey),
            },
            deliveries: periodDeliveries.map((delivery) => ({
                ...delivery,
                sellerName: sellerMap.get(String(delivery?.sellerId || "")) || "Seller",
            })),
        });

        return buildHtmlResponse(document);
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

import { getRequestUserId } from "@/lib/requestAuth";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import authAdmin from "@/lib/authAdmin";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { ORDER_STATUSES, normalizeOrderStatus } from "@/lib/orderLifecycle";
import { getSellerRiskSummary } from "@/lib/orderRisk";

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" });
        }

        await connectDB();

        // Lean + field-selected reads: the stats page only aggregates, so we
        // never need full hydrated documents here.
        const [orders, products, users] = await Promise.all([
            Order.find({})
                .select("status subtotal commissionAmount amount date items sellerId customerConfirmedAt deliveredAt")
                .sort({ date: -1 })
                .lean(),
            Product.find({}).select("name category offerPrice price image").lean(),
            User.find({}).select("sellerSubscriptionStatus riderSubscriptionStatus sellerSubscriptionFee riderSubscriptionFee").lean(),
        ]);

        const normalizedOrders = orders.map((order) => ({
            ...order,
            status: normalizeOrderStatus(order.status),
        }));
        const completedOrdersList = normalizedOrders.filter((order) => order.status === ORDER_STATUSES.COMPLETED);
        const totalRevenue = completedOrdersList.reduce((sum, order) => sum + (Number(order.subtotal) || 0), 0);
        const totalCommissionRevenue = completedOrdersList.reduce((sum, order) => sum + (Number(order.commissionAmount) || 0), 0);

        const activeSellerSubscriptions = users.filter((user) => user.sellerSubscriptionStatus === "active").length;
        const activeRiderSubscriptions = users.filter((user) => user.riderSubscriptionStatus === "active").length;
        const expiredOrOverdueSubscriptions = users.filter((user) => (
            ["overdue", "cancelled", "paused"].includes(user.sellerSubscriptionStatus)
            || ["overdue", "cancelled", "paused"].includes(user.riderSubscriptionStatus)
        )).length;
        const monthlyRecurringRevenue = users.reduce((sum, user) => {
            const sellerFee = user.sellerSubscriptionStatus === "active" ? (Number(user.sellerSubscriptionFee) || 0) : 0;
            const riderFee = user.riderSubscriptionStatus === "active" ? (Number(user.riderSubscriptionFee) || 0) : 0;
            return sum + sellerFee + riderFee;
        }, 0);

        // Orders by status
        const statusCounts = normalizedOrders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
        }, {});

        // Revenue by day (last 7 days)
        const now = Date.now();
        const dayMs = 86400000;
        const revenueByDay = Array.from({ length: 7 }, (_, i) => {
            const start = now - (6 - i) * dayMs;
            const end = start + dayMs;
            const dayOrders = normalizedOrders.filter(o => o.date >= start && o.date < end);
            return {
                day: new Date(start).toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: dayOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0),
                count: dayOrders.length,
            };
        });

        // Top products by order frequency
        const productFreq = {};
        normalizedOrders.forEach(o => {
            o.items.forEach(item => {
                const pid = String(item.product);
                productFreq[pid] = (productFreq[pid] || 0) + item.quantity;
            });
        });
        const topProductIds = Object.entries(productFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => id);
        const topProducts = products
            .filter(p => topProductIds.includes(String(p._id)))
            .map(p => ({ ...p, soldCount: productFreq[String(p._id)] || 0 }));

        // Category breakdown
        const categoryBreakdown = products.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});

        // Group orders by seller once instead of re-scanning all orders per user.
        const ordersBySeller = new Map();
        normalizedOrders.forEach((order) => {
            const sellerKey = String(order.sellerId || "");
            if (!sellerKey) return;
            if (!ordersBySeller.has(sellerKey)) ordersBySeller.set(sellerKey, []);
            ordersBySeller.get(sellerKey).push(order);
        });
        const flaggedSellers = [...ordersBySeller.values()]
            .filter((sellerOrders) => getSellerRiskSummary(sellerOrders).flagged)
            .length;

        return NextResponse.json({
            success: true,
            stats: {
                totalRevenue,
                totalGMV: totalRevenue,
                totalCommissionRevenue,
                monthlyRecurringRevenue,
                activeSellerSubscriptions,
                activeRiderSubscriptions,
                expiredOrOverdueSubscriptions,
                totalOrders: orders.length,
                totalProducts: products.length,
                totalUsers: users.length,
                statusCounts,
                revenueByDay,
                topProducts,
                categoryBreakdown,
                // Orders come back date-desc, so this really is "most recent".
                recentOrders: normalizedOrders.slice(0, 5),
                flaggedSellers,
                deliveredOrders: statusCounts[ORDER_STATUSES.DELIVERED] || 0,
                completedOrders: statusCounts[ORDER_STATUSES.COMPLETED] || 0,
                cancelledOrders: statusCounts[ORDER_STATUSES.CANCELLED] || 0,
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

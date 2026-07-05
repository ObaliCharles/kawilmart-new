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

        const [orders, products, users] = await Promise.all([
            Order.find({}),
            Product.find({}),
            User.find({}),
        ]);

        const normalizedOrders = orders.map((order) => ({
            ...order.toObject(),
            status: normalizeOrderStatus(order.status),
        }));
        const totalRevenue = normalizedOrders
            .filter((order) => order.status === ORDER_STATUSES.COMPLETED)
            .reduce((sum, order) => sum + (Number(order.subtotal) || 0), 0);

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
            .map(p => ({ ...p._doc, soldCount: productFreq[String(p._id)] || 0 }));

        // Category breakdown
        const categoryBreakdown = products.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            stats: {
                totalRevenue,
                totalOrders: orders.length,
                totalProducts: products.length,
                totalUsers: users.length,
                statusCounts,
                revenueByDay,
                topProducts,
                categoryBreakdown,
                recentOrders: normalizedOrders.slice(0, 5),
                flaggedSellers: users.filter((user) => getSellerRiskSummary(
                    normalizedOrders.filter((order) => String(order.sellerId) === String(user._id))
                ).flagged).length,
                deliveredOrders: statusCounts[ORDER_STATUSES.DELIVERED] || 0,
                completedOrders: statusCounts[ORDER_STATUSES.COMPLETED] || 0,
                cancelledOrders: statusCounts[ORDER_STATUSES.CANCELLED] || 0,
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

import { clerkClient } from "@clerk/nextjs/server";
import { getRequestUserId } from "@/lib/requestAuth";
import { getUserRole, invalidateUserRoleCache } from "@/lib/userRoleCache";
import { NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import connectDB from "@/config/db";
import User from "@/models/User";
import Product from "@/models/Product";
import Order from "@/models/Order";
import {
    buildRiderInvoiceSnapshot,
    buildSellerInvoiceSnapshot,
    getRiderAccessState,
    getRiderSubscriptionSnapshot,
    getSellerAccessState,
    getSellerSubscriptionSnapshot,
} from "@/lib/sellerBilling";
import { isSupportMessage, sortMessagesByDate } from "@/lib/supportChat";
import { normalizeOrderStatus, ORDER_STATUSES } from "@/lib/orderLifecycle";
import { notifyUsers } from "@/lib/notifyUsers";
import { syncUserFromClerk } from "@/lib/clerkUserSync";
import { formatRoleLabel, getDashboardPathForRole } from "@/lib/accountNotifications";

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ success: false, message: "Unauthorized" });

        const client = await clerkClient();
        const clerkUsers = await client.users.getUserList({ limit: 100 });

        await connectDB();
        const [dbUsers, products, orders] = await Promise.all([
            User.find({}).lean(),
            Product.find({}).select("userId").lean(),
            Order.find({}).select("sellerId riderId status subtotal commissionAmount deliveryFee customerConfirmedAt deliveredAt date").lean(),
        ]);

        const dbMap = {};
        dbUsers.forEach((u) => { dbMap[u._id] = u; });

        const productCountByUser = products.reduce((acc, product) => {
            const ownerId = String(product?.userId || "");
            acc[ownerId] = (acc[ownerId] || 0) + 1;
            return acc;
        }, {});

        const ordersBySeller = orders.reduce((acc, order) => {
            const sellerId = String(order?.sellerId || "");
            if (!sellerId) {
                return acc;
            }

            if (!acc[sellerId]) {
                acc[sellerId] = [];
            }

            acc[sellerId].push({
                ...order,
                status: normalizeOrderStatus(order?.status),
            });
            return acc;
        }, {});

        const ordersByRider = orders.reduce((acc, order) => {
            const riderId = String(order?.riderId || "");
            if (!riderId) {
                return acc;
            }

            if (!acc[riderId]) {
                acc[riderId] = [];
            }

            acc[riderId].push({
                ...order,
                status: normalizeOrderStatus(order?.status),
            });
            return acc;
        }, {});

        const users = clerkUsers.data.map((u) => {
            const dbUser = dbMap[u.id] || {};
            const role = u.publicMetadata.role || 'buyer';
            const sellerOrders = ordersBySeller[u.id] || [];
            const riderOrders = ordersByRider[u.id] || [];
            const completedSellerOrders = sellerOrders.filter((order) => order.status === ORDER_STATUSES.COMPLETED);
            const completedRiderOrders = riderOrders.filter((order) =>
                order.status === ORDER_STATUSES.DELIVERED || order.status === ORDER_STATUSES.COMPLETED
            );
            const supportMessages = sortMessagesByDate((dbUser?.messages || []).filter((message) => isSupportMessage(message, u.id)));
            const lastSupportMessage = supportMessages[supportMessages.length - 1] || null;
            const supportUnreadCount = supportMessages.filter((message) => String(message?.from || "") === u.id && !message?.read).length;
            const subscription = role === 'rider'
                ? getRiderSubscriptionSnapshot(dbUser)
                : getSellerSubscriptionSnapshot(dbUser);
            const access = role === 'rider'
                ? getRiderAccessState(dbUser)
                : getSellerAccessState(dbUser);
            const billing = role === 'seller'
                ? buildSellerInvoiceSnapshot({ seller: dbUser, orders: sellerOrders })
                : role === 'rider'
                    ? buildRiderInvoiceSnapshot({ rider: dbUser, orders: riderOrders })
                    : null;

            return {
                id: u.id,
                name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                email: u.emailAddresses[0]?.emailAddress || '',
                imageUrl: u.imageUrl,
                role,
                createdAt: u.createdAt,
                cartItems: dbUser?.cartItems || {},
                accountStatus: dbUser?.accountStatus || 'active',
                governmentIdNumber: dbUser?.governmentIdNumber || "",
                legalStatus: dbUser?.legalStatus || "pending",
                legalNotes: dbUser?.legalNotes || "",
                verificationNotes: dbUser?.verificationNotes || "",
                businessName: dbUser?.businessName || "",
                businessLocation: dbUser?.businessLocation || "",
                phoneNumber: dbUser?.phoneNumber || "",
                businessLicense: dbUser?.businessLicense || "",
                taxId: dbUser?.taxId || "",
                sellerDescription: dbUser?.sellerDescription || "",
                sellerSupportEmail: dbUser?.sellerSupportEmail || "",
                sellerWhatsappNumber: dbUser?.sellerWhatsappNumber || "",
                sellerLocationCity: dbUser?.sellerLocationCity || "",
                sellerLocationRegion: dbUser?.sellerLocationRegion || "",
                sellerLocationCountry: dbUser?.sellerLocationCountry || "Uganda",
                sellerBadgeLabel: dbUser?.sellerBadgeLabel || "",
                sellerBadgeTone: dbUser?.sellerBadgeTone || "emerald",
                sellerBadgeGrantedAt: dbUser?.sellerBadgeGrantedAt || null,
                sellerBadgeGrantedBy: dbUser?.sellerBadgeGrantedBy || "",
                sellerSupportPriority: dbUser?.sellerSupportPriority || "standard",
                riderBaseLocation: dbUser?.riderBaseLocation || "",
                vehicleType: dbUser?.vehicleType,
                licensePlate: dbUser?.licensePlate,
                driversLicense: dbUser?.driversLicense,
                riderAvailability: dbUser?.riderAvailability || 'available',
                isVerified: dbUser?.isVerified || false,
                notifications: dbUser?.notifications || [],
                subscription,
                access,
                sellerMetrics: {
                    productCount: productCountByUser[u.id] || 0,
                    orderCount: sellerOrders.length,
                    completedOrders: completedSellerOrders.length,
                    completedRevenue: completedSellerOrders.reduce((sum, order) => sum + (Number(order?.subtotal) || 0), 0),
                },
                riderMetrics: {
                    assignedDeliveries: riderOrders.length,
                    completedDeliveries: completedRiderOrders.length,
                    activeDeliveries: riderOrders.filter((order) =>
                        ![ORDER_STATUSES.DELIVERED, ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(order.status)
                    ).length,
                    payoutTotal: completedRiderOrders.reduce((sum, order) => sum + (Number(order?.deliveryFee) || 0), 0),
                },
                billing,
                supportSummary: {
                    unreadCount: supportUnreadCount,
                    lastMessageAt: lastSupportMessage?.date || null,
                    lastMessagePreview: lastSupportMessage?.content
                        ? `${lastSupportMessage.content.slice(0, 100)}${lastSupportMessage.content.length > 100 ? '...' : ''}`
                        : "",
                },
            };
        });

        return NextResponse.json({ success: true, users });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ success: false, message: "Unauthorized" });

        const { targetUserId, role } = await request.json();
        const validRoles = ['buyer', 'seller', 'admin', 'rider'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ success: false, message: "Invalid role" });
        }

        await connectDB();
        await syncUserFromClerk(targetUserId);
        const previousRole = await getUserRole(targetUserId);
        const client = await clerkClient();
        await client.users.updateUserMetadata(targetUserId, {
            publicMetadata: { role }
        });
        invalidateUserRoleCache(targetUserId);

        if (previousRole !== role) {
            await notifyUsers([{
                userId: targetUserId,
                notification: {
                    type: "system",
                    title: "Role updated",
                    message: `Your KawilMart role is now ${formatRoleLabel(role)}.`,
                    read: false,
                    date: new Date(),
                },
                emailTitle: "KawilMart role updated",
                emailMessage: `Your KawilMart role was updated from ${formatRoleLabel(previousRole || "buyer")} to ${formatRoleLabel(role)}.`,
                ctaLabel: "Open dashboard",
                ctaPath: getDashboardPathForRole(role),
            }]);
        }

        return NextResponse.json({ success: true, message: `Role updated to ${role}` });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

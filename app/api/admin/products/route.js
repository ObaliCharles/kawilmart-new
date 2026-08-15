import { NextResponse } from "next/server";
import authAdmin from "@/lib/authAdmin";
import { writeAuditLog } from "@/lib/auditLog";
import connectDB from "@/config/db";
import { getRequestUserId } from "@/lib/requestAuth";
import Product from "@/models/Product";
import User from "@/models/User";

const PRODUCT_STATUSES = new Set(["active", "draft", "hidden", "rejected"]);

const serializeAdminProduct = (product = {}, seller = null) => ({
    ...product,
    productStatus: product.productStatus || "active",
    moderationReason: product.moderationReason || "",
    moderatedAt: product.moderatedAt || null,
    moderatedBy: product.moderatedBy || "",
    seller: seller ? {
        id: String(seller._id),
        name: seller.businessName || seller.name || "Seller",
        email: seller.email || "",
        location: seller.businessLocation || "",
    } : null,
});

export async function GET(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const products = await Product.find({}).sort({ date: -1 }).lean();
        const sellerIds = [...new Set(products.map((product) => String(product.userId || "")).filter(Boolean))];
        const sellers = sellerIds.length
            ? await User.find({ _id: { $in: sellerIds } })
                .select("_id name email businessName businessLocation")
                .lean()
            : [];
        const sellerMap = new Map(sellers.map((seller) => [String(seller._id), seller]));

        return NextResponse.json({
            success: true,
            products: products.map((product) => serializeAdminProduct(product, sellerMap.get(String(product.userId)))),
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const userId = await getRequestUserId(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { productId, productStatus, moderationReason = "" } = await request.json();
        const nextStatus = typeof productStatus === "string" ? productStatus.trim() : "";

        if (!productId) {
            return NextResponse.json({ success: false, message: "productId is required" }, { status: 400 });
        }

        if (!PRODUCT_STATUSES.has(nextStatus)) {
            return NextResponse.json({ success: false, message: "Invalid product status" }, { status: 400 });
        }

        await connectDB();

        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        const previousStatus = product.productStatus || "active";
        product.productStatus = nextStatus;
        product.moderationReason = String(moderationReason || "").trim().slice(0, 500);
        product.moderatedAt = new Date();
        product.moderatedBy = userId;
        await product.save();

        await writeAuditLog({
            actorId: userId,
            action: "product.moderation.updated",
            targetType: "product",
            targetId: String(product._id),
            summary: `Product status changed from ${previousStatus} to ${nextStatus}`,
            metadata: {
                previousStatus,
                nextStatus,
                moderationReason: product.moderationReason,
                sellerId: product.userId,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Product moderation updated",
            product: serializeAdminProduct(product.toObject()),
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

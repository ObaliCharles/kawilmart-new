import connectDB from "@/config/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { NextResponse } from "next/server";
import { getRequestUserId } from "@/lib/requestAuth";
import { getOrSyncDatabaseUser } from "@/lib/clerkUserSync";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { ORDER_STATUSES } from "@/lib/orderLifecycle";

const clampRating = (value) => {
    const rating = Math.round(Number(value));
    return Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : 0;
};

const recalculateAverage = (reviews = []) => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return Number((total / reviews.length).toFixed(2));
};

// A review counts as verified only when this buyer actually received this
// product. Checked server-side against their own delivered orders.
const hasPurchased = async (userId, productId) => {
    const order = await Order.findOne({
        userId,
        status: { $in: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.COMPLETED] },
        "items.product": String(productId),
    }).select("_id").lean();

    return Boolean(order);
};

export async function POST(request) {
    try {
        const userId = await getRequestUserId(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Please sign in to leave a review" }, { status: 401 });
        }

        const rateCheck = checkRateLimit(`product-review:${userId}`, { limit: 8, windowMs: 60000 });
        if (!rateCheck.allowed) {
            return NextResponse.json(rateLimitResponse(rateCheck.retryAfterSeconds), { status: 429 });
        }

        const { productId, rating, title, comment } = await request.json();

        const safeRating = clampRating(rating);
        if (!productId || !safeRating) {
            return NextResponse.json({ success: false, message: "Please choose a rating from 1 to 5" }, { status: 400 });
        }

        await connectDB();

        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        if (String(product.userId) === String(userId)) {
            return NextResponse.json({ success: false, message: "You cannot review your own product" }, { status: 403 });
        }

        const [reviewer, verifiedPurchase] = await Promise.all([
            getOrSyncDatabaseUser(userId, { select: "name", lean: true }),
            hasPurchased(userId, productId),
        ]);

        const entry = {
            userId,
            userName: reviewer?.name || "KawilMart shopper",
            rating: safeRating,
            title: String(title || "").trim().slice(0, 90),
            comment: String(comment || "").trim().slice(0, 1000),
            verifiedPurchase,
            date: new Date(),
        };

        // One review per shopper per product: a second submission edits the
        // first rather than stacking duplicates onto the average.
        const existingIndex = product.reviews.findIndex((review) => String(review.userId) === String(userId));
        if (existingIndex >= 0) {
            product.reviews[existingIndex].set(entry);
        } else {
            product.reviews.push(entry);
        }

        product.averageRating = recalculateAverage(product.reviews);
        await product.save();

        return NextResponse.json({
            success: true,
            message: existingIndex >= 0 ? "Your review was updated" : "Thanks for your review",
            averageRating: product.averageRating,
            reviewCount: product.reviews.length,
        });
    } catch (error) {
        console.error("Product review error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const userId = await getRequestUserId(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        if (!productId) {
            return NextResponse.json({ success: false, message: "Missing product" }, { status: 400 });
        }

        await connectDB();
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        product.reviews = product.reviews.filter((review) => String(review.userId) !== String(userId));
        product.averageRating = recalculateAverage(product.reviews);
        await product.save();

        return NextResponse.json({ success: true, message: "Review removed" });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

import "server-only";

import connectDB from "@/config/db";
import { serializeProductForClient } from "@/lib/productRating";
import { getSellerAccessState } from "@/lib/sellerBilling";
import Product from "@/models/Product";
import User from "@/models/User";

export const getStorefrontProducts = async ({ limit = 1000, page = 1, userId = null } = {}) => {
    await connectDB();

    const skip = (Math.max(1, page) - 1) * limit;
    const productDocuments = await Product.find({})
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const sellerIds = [...new Set(productDocuments.map((product) => product.userId).filter(Boolean))];
    const sellers = sellerIds.length
        ? await User.find({ _id: { $in: sellerIds } })
            .select("_id name businessName businessLocation sellerLocationCity sellerLocationRegion sellerLocationCountry sellerRatingSummary sellerSubscriptionStatus sellerAccessUntil isVerified sellerBadgeLabel sellerBadgeTone")
            .lean()
        : [];

    const sellerMap = new Map(sellers.map((seller) => [String(seller._id), seller]));

    const products = productDocuments.reduce((acc, product) => {
        const seller = sellerMap.get(String(product.userId));
        const sellerAccess = seller ? getSellerAccessState(seller) : { hasAccess: true };

        if (seller && !sellerAccess.hasAccess) {
            return acc;
        }

        acc.push({
            ...serializeProductForClient(product, userId),
            sellerProfile: seller ? {
                id: String(seller._id),
                name: seller.businessName || seller.name || "Seller",
                location: seller.businessLocation || [
                    seller.sellerLocationCity,
                    seller.sellerLocationRegion,
                    seller.sellerLocationCountry,
                ].filter(Boolean).join(", ") || product.sellerLocation || "",
                ratingSummary: seller.sellerRatingSummary || {
                    totalReviews: 0,
                    reliability: 0,
                    speed: 0,
                    communication: 0,
                    overall: 0,
                },
                subscriptionStatus: seller.sellerSubscriptionStatus || "active",
                access: sellerAccess,
                isVerified: Boolean(seller.isVerified),
                badgeLabel: seller.sellerBadgeLabel || "",
                badgeTone: seller.sellerBadgeTone || "emerald",
            } : null,
        });

        return acc;
    }, []);

    return JSON.parse(JSON.stringify(products));
};

export const getStorefrontProductsSafe = async (options = {}) => {
    try {
        return await getStorefrontProducts(options);
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("Unable to load storefront products:", error?.message || error);
        }

        return [];
    }
};

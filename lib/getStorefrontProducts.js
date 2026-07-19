import "server-only";

import connectDB from "@/config/db";
import { serializeProductForClient } from "@/lib/productRating";
import { getSellerAccessState } from "@/lib/sellerBilling";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getStorefrontProducts = async ({ limit = 1000, page = 1, userId = null, search = "", category = "" } = {}) => {
    await connectDB();

    // Optional server-side filters so clients don't have to download the
    // whole catalog to search it (the scale path once the catalog outgrows
    // the in-memory client cache).
    const query = {};
    const trimmedSearch = typeof search === "string" ? search.trim().slice(0, 80) : "";
    if (trimmedSearch) {
        const pattern = new RegExp(escapeRegex(trimmedSearch), "i");
        query.$or = [{ name: pattern }, { category: pattern }, { brand: pattern }];
    }
    const trimmedCategory = typeof category === "string" ? category.trim().slice(0, 80) : "";
    if (trimmedCategory) {
        query.category = trimmedCategory;
    }

    const skip = (Math.max(1, page) - 1) * limit;
    const productDocuments = await Product.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const sellerIds = [...new Set(productDocuments.map((product) => product.userId).filter(Boolean))];
    const sellers = sellerIds.length
        ? await User.find({ _id: { $in: sellerIds } })
            .select("_id name email imageUrl businessName businessLocation sellerDescription sellerSupportEmail sellerWhatsappNumber sellerLocationCity sellerLocationRegion sellerLocationCountry sellerRatingSummary sellerSubscriptionStatus sellerAccessUntil isVerified sellerBadgeLabel sellerBadgeTone storeFollowersCount")
            .lean()
        : [];

    const sellerMap = new Map(sellers.map((seller) => [String(seller._id), seller]));
    const productIds = productDocuments.map((product) => String(product._id)).filter(Boolean);
    const soldCountMap = productIds.length
        ? new Map(
            (await Order.aggregate([
                { $match: { "items.product": { $in: productIds } } },
                { $unwind: "$items" },
                { $match: { "items.product": { $in: productIds } } },
                {
                    $group: {
                        _id: "$items.product",
                        soldCount: { $sum: { $ifNull: ["$items.quantity", 0] } },
                    },
                },
            ])).map((entry) => [String(entry._id), Number(entry.soldCount) || 0])
        )
        : new Map();

    const products = productDocuments.reduce((acc, product) => {
        const seller = sellerMap.get(String(product.userId));
        const sellerAccess = seller ? getSellerAccessState(seller) : { hasAccess: true };

        if (seller && !sellerAccess.hasAccess) {
            return acc;
        }

        acc.push({
            ...serializeProductForClient(product, userId),
            soldCount: soldCountMap.get(String(product._id)) || 0,
            sellerProfile: seller ? {
                id: String(seller._id),
                name: seller.businessName || seller.name || "Seller",
                ownerName: seller.name || "",
                email: seller.email || "",
                avatarUrl: seller.storeAvatar || seller.imageUrl || "",
                coverImage: seller.storeCoverImage || "",
                description: seller.sellerDescription || "",
                supportEmail: seller.sellerSupportEmail || "",
                whatsappNumber: seller.sellerWhatsappNumber || "",
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
                followersCount: Number(seller.storeFollowersCount) || 0,
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

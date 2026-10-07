import "server-only";

import connectDB from "@/config/db";
import { serializeProductForClient } from "@/lib/productRating";
import { getSellerAccessState } from "@/lib/sellerBilling";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import Area from "@/models/Area";
import { getNearbyRankingScore, NEARBY_CANDIDATE_LIMIT } from "@/config/locationRanking";
import { ALLOWED_RADIUS_KM, areValidCoordinates, calculateDistanceKm, getBoundingBox, getPublicProductLocation } from "@/lib/productLocation";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildProductQuery = ({ search = "", category = "" } = {}) => {
    const query = {
        $and: [{
            $or: [
                { productStatus: "active" },
                { productStatus: { $exists: false } },
                { productStatus: "" },
                { productStatus: null },
            ],
        }],
    };
    const trimmedSearch = typeof search === "string" ? search.trim().slice(0, 80) : "";
    if (trimmedSearch) {
        const pattern = new RegExp(escapeRegex(trimmedSearch), "i");
        query.$and.push({ $or: [{ name: pattern }, { category: pattern }, { brand: pattern }] });
    }
    const trimmedCategory = typeof category === "string" ? category.trim().slice(0, 80) : "";
    if (trimmedCategory) {
        query.category = trimmedCategory;
    }

    return query;
};

const loadReferencedAreaHierarchy = async (productDocuments) => {
    let pendingIds = [...new Set(productDocuments.map((product) => product.areaId ? String(product.areaId) : "").filter(Boolean))];
    const areasById = new Map();

    // A hierarchy can grow beyond city → division later. Load each unseen
    // parent level rather than assuming today's seed depth.
    while (pendingIds.length) {
        const unseenIds = pendingIds.filter((id) => !areasById.has(id));
        if (!unseenIds.length) break;
        const areas = await Area.find({ _id: { $in: unseenIds } }).lean();
        areas.forEach((area) => areasById.set(String(area._id), area));
        pendingIds = [...new Set(areas.map((area) => area.parentId ? String(area.parentId) : "").filter(Boolean))];
    }

    return areasById;
};

const buildStorefrontProductPayloads = async (productDocuments = [], userId = null, buyerCoordinates = null) => {
    const areaById = await loadReferencedAreaHierarchy(productDocuments);
    const sellerIds = [...new Set(productDocuments.map((product) => product.userId).filter(Boolean))];
    const sellers = sellerIds.length
        ? await User.find({ _id: { $in: sellerIds } })
            .select("_id name email imageUrl businessName businessLocation sellerDescription storeCoverImage storeAvatar sellerSupportEmail sellerWhatsappNumber sellerLocationCity sellerLocationRegion sellerLocationCountry sellerRatingSummary sellerSubscriptionStatus sellerAccessUntil isVerified sellerBadgeLabel sellerBadgeTone storeFollowersCount")
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
            publicLocation: getPublicProductLocation(product, { areasById: areaById, buyerCoordinates }),
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

const resolveAreaIds = async (areaId) => {
    if (!areaId) return null;
    const area = await Area.findById(areaId).lean();
    if (!area) return [];
    const children = await Area.find({ parentId: area._id }).select("_id").lean();
    return [area._id, ...children.map((child) => child._id)];
};

export const getStorefrontProducts = async ({ limit = 1000, page = 1, userId = null, search = "", category = "", areaId = "", buyerCoordinates = null, radiusKm = null } = {}) => {
    const result = await getStorefrontProductsPage({ limit, page, userId, search, category, areaId, buyerCoordinates, radiusKm });
    return result.products;
};

const getNearbyScore = (product, radiusKm, now = Date.now()) => {
    return getNearbyRankingScore({
        distanceKm: product.publicLocation?.distanceKm,
        radiusKm,
        date: product.date,
        sellerRating: product.sellerProfile?.ratingSummary?.overall,
        now,
    });
};

export const getStorefrontProductsPage = async ({ limit = 1000, page = 1, userId = null, search = "", category = "", areaId = "", buyerCoordinates = null, radiusKm = null } = {}) => {
    await connectDB();

    // Optional server-side filters so clients don't have to download the
    // whole catalog to search it (the scale path once the catalog outgrows
    // the in-memory client cache).
    const query = buildProductQuery({ search, category });
    const validBuyerCoordinates = buyerCoordinates && areValidCoordinates(buyerCoordinates.lat, buyerCoordinates.lng) ? buyerCoordinates : null;
    const normalizedRadius = ALLOWED_RADIUS_KM.includes(Number(radiusKm)) ? Number(radiusKm) : null;
    const areaIds = await resolveAreaIds(areaId);
    if (areaIds) query.areaId = { $in: areaIds };
    if (normalizedRadius && validBuyerCoordinates) {
        const bounds = getBoundingBox(validBuyerCoordinates.lat, validBuyerCoordinates.lng, normalizedRadius);
        query.lat = { $gte: bounds.minLat, $lte: bounds.maxLat };
        query.lng = { $gte: bounds.minLng, $lte: bounds.maxLng };
    }
    let productDocuments = await Product.find(query)
        .sort({ date: -1 })
        .limit(normalizedRadius && validBuyerCoordinates ? NEARBY_CANDIDATE_LIMIT : 0)
        .lean();

    if (normalizedRadius && validBuyerCoordinates) {
        productDocuments = productDocuments
            .map((product) => ({ product, distanceKm: calculateDistanceKm(validBuyerCoordinates.lat, validBuyerCoordinates.lng, product.lat, product.lng) }))
            .filter(({ distanceKm }) => Number.isFinite(distanceKm) && distanceKm <= normalizedRadius)
            .map(({ product }) => product);
    }
    let products = await buildStorefrontProductPayloads(productDocuments, userId, validBuyerCoordinates);
    if (normalizedRadius && validBuyerCoordinates) {
        products = products
            .map((product) => ({ product, nearbyScore: getNearbyScore(product, normalizedRadius) }))
            .sort((left, right) => right.nearbyScore - left.nearbyScore || (left.product.publicLocation?.distanceKm || Infinity) - (right.product.publicLocation?.distanceKm || Infinity))
            .map(({ product }) => product);
    }
    const total = products.length;
    const safeLimit = Math.min(1000, Math.max(1, Number(limit) || 24));
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;
    return { products: products.slice(skip, skip + safeLimit), total, page: safePage, totalPages: Math.ceil(total / safeLimit) };
};

export const countStorefrontProducts = async ({ search = "", category = "" } = {}) => {
    await connectDB();

    const productDocuments = await Product.find(buildProductQuery({ search, category }))
        .select("_id userId")
        .lean();
    const sellerIds = [...new Set(productDocuments.map((product) => product.userId).filter(Boolean))];
    const sellers = sellerIds.length
        ? await User.find({ _id: { $in: sellerIds } })
            .select("_id sellerSubscriptionStatus sellerAccessUntil")
            .lean()
        : [];
    const sellerMap = new Map(sellers.map((seller) => [String(seller._id), seller]));

    return productDocuments.filter((product) => {
        const seller = sellerMap.get(String(product.userId));
        return !seller || getSellerAccessState(seller).hasAccess;
    }).length;
};

export const getStorefrontProductById = async (productId, { userId = null } = {}) => {
    await connectDB();

    if (!productId) {
        return null;
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
        return null;
    }

    const [serializedProduct] = await buildStorefrontProductPayloads([product], userId);
    return serializedProduct || null;
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

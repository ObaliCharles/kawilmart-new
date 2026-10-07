import "server-only";

import Area from "@/models/Area";
import SavedSearch from "@/models/SavedSearch";
import { areValidCoordinates, calculateDistanceKm } from "@/lib/productLocation";
import { categoryMatchesSelection } from "@/lib/marketplaceCategories";
import { notifyUsers } from "@/lib/notifyUsers";

const textMatches = (product, search) => {
    const value = String(search || "").trim().toLowerCase();
    if (!value) return true;
    return [product.name, product.description, product.category, product.subcategory].some((field) => String(field || "").toLowerCase().includes(value));
};

const resolveAreaIds = async (areaId) => {
    if (!areaId) return null;
    const children = await Area.find({ parentId: areaId }).select("_id").lean();
    return [String(areaId), ...children.map((area) => String(area._id))];
};

export const notifyMatchingSavedSearches = async (product) => {
    if (!product || product.productStatus && product.productStatus !== "active") return { count: 0 };
    const searches = await SavedSearch.find({ enabled: true, notifiedProductIds: { $ne: String(product._id) } }).lean();
    const areaCache = new Map();
    const matches = [];

    for (const savedSearch of searches) {
        if (!textMatches(product, savedSearch.search)) continue;
        if (savedSearch.category && !categoryMatchesSelection(product.category, savedSearch.category)) continue;
        const price = Number(product.offerPrice || product.price) || 0;
        if (savedSearch.minPrice !== null && price < savedSearch.minPrice) continue;
        if (savedSearch.maxPrice !== null && price > savedSearch.maxPrice) continue;
        if (savedSearch.areaId) {
            const key = String(savedSearch.areaId);
            if (!areaCache.has(key)) areaCache.set(key, await resolveAreaIds(savedSearch.areaId));
            if (!areaCache.get(key).includes(String(product.areaId || ""))) continue;
        }
        // Radius-only saved searches require coordinates from a future explicit
        // saved GPS preference; area searches stay useful without storing GPS.
        matches.push(savedSearch);
    }

    if (!matches.length) return { count: 0 };
    await SavedSearch.updateMany({ _id: { $in: matches.map((entry) => entry._id) } }, { $addToSet: { notifiedProductIds: String(product._id) } });
    await notifyUsers(matches.map((savedSearch) => ({
        userId: savedSearch.userId,
        sendEmail: false,
        notification: {
            type: "system",
            title: "New listing matches your saved search",
            message: `${product.name} matches “${savedSearch.name}”.`,
            date: new Date(),
            read: false,
        },
    })));
    return { count: matches.length };
};

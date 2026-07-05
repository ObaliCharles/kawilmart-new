import "server-only";

import connectDB from "@/config/db";
import { areCartItemsEqual, filterCartItemsByProductIds, normalizeCartItems } from "@/lib/cart";
import { getSellerAccessState } from "@/lib/sellerBilling";
import Product from "@/models/Product";
import User from "@/models/User";

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const getValidProductIds = (cartItems = {}) => (
    Object.keys(normalizeCartItems(cartItems)).filter((productId) => OBJECT_ID_PATTERN.test(productId))
);

export const sanitizeStoredCartItems = async (cartItems = {}) => {
    await connectDB();

    const normalizedCartItems = normalizeCartItems(cartItems);
    const productIds = getValidProductIds(normalizedCartItems);

    if (!productIds.length) {
        return {};
    }

    const productDocuments = await Product.find({ _id: { $in: productIds } })
        .select("_id userId")
        .lean();

    if (!productDocuments.length) {
        return {};
    }

    const sellerIds = [...new Set(productDocuments.map((product) => String(product.userId || "")).filter(Boolean))];
    const sellerDocuments = sellerIds.length
        ? await User.find({ _id: { $in: sellerIds } })
            .select("_id sellerSubscriptionStatus sellerSubscriptionNextBillingDate sellerAccessUntil")
            .lean()
        : [];

    const activeSellerIds = new Set(
        sellerDocuments
            .filter((seller) => getSellerAccessState(seller).hasAccess)
            .map((seller) => String(seller._id))
    );

    const availableProductIds = productDocuments
        .filter((product) => activeSellerIds.has(String(product.userId)))
        .map((product) => String(product._id));

    return filterCartItemsByProductIds(normalizedCartItems, availableProductIds);
};

export const persistSanitizedUserCart = async (user) => {
    const sanitizedCartItems = await sanitizeStoredCartItems(user?.cartItems || {});

    if (user && !areCartItemsEqual(user.cartItems, sanitizedCartItems)) {
        user.cartItems = sanitizedCartItems;
        await user.save();
    }

    return sanitizedCartItems;
};

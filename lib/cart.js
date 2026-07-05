export const normalizeCartItems = (cartItems = {}) => {
    if (!cartItems || typeof cartItems !== "object" || Array.isArray(cartItems)) {
        return {};
    }

    return Object.entries(cartItems).reduce((acc, [productId, quantity]) => {
        const normalizedProductId = String(productId || "").trim();
        const normalizedQuantity = Math.floor(Number(quantity));

        if (!normalizedProductId || !Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
            return acc;
        }

        acc[normalizedProductId] = normalizedQuantity;
        return acc;
    }, {});
};

export const filterCartItemsByProductIds = (cartItems = {}, availableProductIds = []) => {
    const normalizedCartItems = normalizeCartItems(cartItems);
    const availableIds = availableProductIds instanceof Set
        ? new Set(Array.from(availableProductIds).map((productId) => String(productId)).filter(Boolean))
        : new Set((availableProductIds || []).map((productId) => String(productId)).filter(Boolean));

    return Object.entries(normalizedCartItems).reduce((acc, [productId, quantity]) => {
        if (availableIds.has(productId)) {
            acc[productId] = quantity;
        }

        return acc;
    }, {});
};

export const countCartItems = (cartItems = {}) => (
    Object.values(normalizeCartItems(cartItems)).reduce((sum, quantity) => sum + quantity, 0)
);

export const areCartItemsEqual = (left = {}, right = {}) => {
    const normalizedLeft = normalizeCartItems(left);
    const normalizedRight = normalizeCartItems(right);
    const leftKeys = Object.keys(normalizedLeft);
    const rightKeys = Object.keys(normalizedRight);

    if (leftKeys.length !== rightKeys.length) {
        return false;
    }

    return leftKeys.every((key) => normalizedLeft[key] === normalizedRight[key]);
};

export const parseProductStockInput = (value) => {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
        throw new Error("Stock must be zero or greater");
    }

    return Math.floor(numericValue);
};

export const getProductStockSnapshot = (product = {}) => {
    if (
        product?.stock === null
        || product?.stock === undefined
        || (typeof product?.stock === "string" && product.stock.trim() === "")
    ) {
        return {
            hasTrackedStock: false,
            value: null,
            status: "untracked",
            label: "Stock updates soon",
            shortLabel: "Stock soon",
        };
    }

    const numericStock = Number(product?.stock);

    if (!Number.isFinite(numericStock) || numericStock < 0) {
        return {
            hasTrackedStock: false,
            value: null,
            status: "untracked",
            label: "Stock updates soon",
            shortLabel: "Stock soon",
        };
    }

    const stock = Math.max(0, Math.floor(numericStock));

    if (stock === 0) {
        return {
            hasTrackedStock: true,
            value: 0,
            status: "out",
            label: "Out of stock",
            shortLabel: "Sold out",
        };
    }

    if (stock === 1) {
        return {
            hasTrackedStock: true,
            value: 1,
            status: "low",
            label: "1 item left",
            shortLabel: "1 left",
        };
    }

    if (stock <= 5) {
        return {
            hasTrackedStock: true,
            value: stock,
            status: "low",
            label: `${stock} items left`,
            shortLabel: `${stock} left`,
        };
    }

    return {
        hasTrackedStock: true,
        value: stock,
        status: "in_stock",
        label: `${stock} in stock`,
        shortLabel: `${stock} in stock`,
    };
};

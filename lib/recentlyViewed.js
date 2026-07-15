// Recently-viewed products, tracked client-side in localStorage so it works
// for guests and signed-in users alike with zero backend cost.
const STORAGE_KEY = "kw_recently_viewed";
const MAX_ENTRIES = 20;

export const getRecentlyViewedIds = () => {
    if (typeof window === "undefined") return [];
    try {
        const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(raw) ? raw.filter((id) => typeof id === "string" && id) : [];
    } catch {
        return [];
    }
};

export const recordRecentlyViewed = (productId) => {
    if (typeof window === "undefined" || !productId) return;
    try {
        const ids = getRecentlyViewedIds().filter((id) => id !== String(productId));
        ids.unshift(String(productId));
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ENTRIES)));
    } catch {
        // Storage full/blocked — tracking is best-effort.
    }
};

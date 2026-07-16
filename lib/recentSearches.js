// Recent search terms, tracked client-side in localStorage — same pattern as
// lib/recentlyViewed.js. Works for guests and signed-in users with zero
// backend cost, and survives across sessions on the same device.
const STORAGE_KEY = "kw_recent_searches";
const MAX_ENTRIES = 5;

export const getRecentSearches = () => {
    if (typeof window === "undefined") return [];
    try {
        const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(raw) ? raw.filter((term) => typeof term === "string" && term.trim()) : [];
    } catch {
        return [];
    }
};

const persist = (terms) => {
    if (typeof window === "undefined") return terms;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
    } catch {
        // Storage full/blocked — tracking is best-effort.
    }
    return terms;
};

// Adds a term (case-insensitively de-duplicated, most recent first) and
// returns the updated list so callers can sync it straight into state.
export const addRecentSearch = (term) => {
    const trimmed = String(term || "").trim();
    if (!trimmed) return getRecentSearches();

    const existing = getRecentSearches().filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase());
    existing.unshift(trimmed);
    return persist(existing.slice(0, MAX_ENTRIES));
};

export const removeRecentSearch = (term) => {
    const remaining = getRecentSearches().filter((entry) => entry.toLowerCase() !== String(term || "").toLowerCase());
    return persist(remaining);
};

export const clearRecentSearches = () => persist([]);

// Central weights for intentional GPS discovery only. Normal marketplace
// search keeps its existing ordering in app/all-products/page.jsx.
export const NEARBY_RANKING_WEIGHTS = {
    distance: 0.5,
    freshness: 0.3,
    sellerRating: 0.2,
};

export const NEARBY_CANDIDATE_LIMIT = 1500;
export const NEARBY_FRESHNESS_WINDOW_DAYS = 30;

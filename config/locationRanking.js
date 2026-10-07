// Central weights for intentional GPS discovery only. Normal marketplace
// search keeps its existing ordering in app/all-products/page.jsx.
export const NEARBY_RANKING_WEIGHTS = {
    distance: 0.5,
    freshness: 0.3,
    sellerRating: 0.2,
};

export const NEARBY_CANDIDATE_LIMIT = 1500;
export const NEARBY_FRESHNESS_WINDOW_DAYS = 30;

export const getNearbyRankingScore = ({ distanceKm, radiusKm, date, sellerRating, now = Date.now() }) => {
    const distance = Number(distanceKm);
    const radius = Number(radiusKm);
    const distanceScore = Number.isFinite(distance) && Number.isFinite(radius) && radius > 0
        ? Math.max(0, 1 - (distance / radius))
        : 0;
    const ageDays = Math.max(0, (now - Number(date || now)) / 86_400_000);
    const freshnessScore = Math.max(0, 1 - (ageDays / NEARBY_FRESHNESS_WINDOW_DAYS));
    const sellerRatingScore = Math.min(1, Math.max(0, (Number(sellerRating) || 0) / 5));
    return (distanceScore * NEARBY_RANKING_WEIGHTS.distance)
        + (freshnessScore * NEARBY_RANKING_WEIGHTS.freshness)
        + (sellerRatingScore * NEARBY_RANKING_WEIGHTS.sellerRating);
};

const clampScore = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return 0;
    }

    return Math.max(1, Math.min(5, Math.round(numericValue)));
};

export const normalizeSellerReviewInput = (review = {}) => ({
    reliability: clampScore(review?.reliability),
    speed: clampScore(review?.speed),
    communication: clampScore(review?.communication),
    comment: String(review?.comment || "").trim(),
});

export const getSellerReviewOverall = (review = {}) => {
    const reliability = clampScore(review?.reliability);
    const speed = clampScore(review?.speed);
    const communication = clampScore(review?.communication);
    return Number(((reliability + speed + communication) / 3).toFixed(1));
};

export const getSellerRatingSummary = (reviews = []) => {
    const safeReviews = Array.isArray(reviews) ? reviews.filter(Boolean) : [];

    if (!safeReviews.length) {
        return {
            totalReviews: 0,
            reliability: 0,
            speed: 0,
            communication: 0,
            overall: 0,
        };
    }

    const totals = safeReviews.reduce((sum, review) => ({
        reliability: sum.reliability + clampScore(review?.reliability),
        speed: sum.speed + clampScore(review?.speed),
        communication: sum.communication + clampScore(review?.communication),
    }), { reliability: 0, speed: 0, communication: 0 });

    const count = safeReviews.length;
    const reliability = Number((totals.reliability / count).toFixed(1));
    const speed = Number((totals.speed / count).toFixed(1));
    const communication = Number((totals.communication / count).toFixed(1));

    return {
        totalReviews: count,
        reliability,
        speed,
        communication,
        overall: Number(((reliability + speed + communication) / 3).toFixed(1)),
    };
};

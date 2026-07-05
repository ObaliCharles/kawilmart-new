const MAX_RATING = 5;
const LIKE_RATING_TARGET = 30;

const clampRating = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return 0;
    }

    return Number(Math.max(0, Math.min(MAX_RATING, numericValue)).toFixed(1));
};

export function getReviewAverage(product = {}) {
    const reviews = Array.isArray(product.reviews) ? product.reviews : [];

    if (!reviews.length) {
        return 0;
    }

    const persistedAverage = Number(product.averageRating);
    if (Number.isFinite(persistedAverage) && persistedAverage > 0) {
        return clampRating(persistedAverage);
    }

    const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return clampRating(total / reviews.length);
}

export function getLikeRating(likesCount = 0) {
    const safeLikes = Math.max(0, Number(likesCount) || 0);

    if (!safeLikes) {
        return 0;
    }

    const normalizedLikeScore = Math.log10(safeLikes + 1) / Math.log10(LIKE_RATING_TARGET + 1);
    return clampRating(1 + normalizedLikeScore * 4);
}

export function getProductRatingSnapshot(product = {}) {
    const likedBy = Array.isArray(product.likedBy) ? product.likedBy : [];
    const likesCount = Math.max(0, Number(product.likesCount) || likedBy.length || 0);
    const reviews = Array.isArray(product.reviews) ? product.reviews : [];
    const reviewCount = reviews.length;
    const reviewAverage = getReviewAverage(product);
    const likeRating = getLikeRating(likesCount);

    let rating = 0;
    let source = 'none';

    if (reviewCount > 0 && likesCount > 0) {
        rating = clampRating((reviewAverage * 0.8) + (likeRating * 0.2));
        source = 'blended';
    } else if (reviewCount > 0) {
        rating = reviewAverage;
        source = 'reviews';
    } else if (likesCount > 0) {
        rating = likeRating;
        source = 'likes';
    }

    return {
        rating,
        reviewAverage,
        reviewCount,
        likeRating,
        likesCount,
        source,
        hasRating: rating > 0,
        filledStars: Math.round(rating),
    };
}

export function serializeProductForClient(product, currentUserId = null) {
    const baseProduct = typeof product?.toObject === 'function' ? product.toObject() : { ...product };
    const likedBy = Array.isArray(baseProduct.likedBy) ? baseProduct.likedBy : [];
    const likesCount = Math.max(0, Number(baseProduct.likesCount) || likedBy.length || 0);
    const ratingSnapshot = getProductRatingSnapshot({ ...baseProduct, likesCount, likedBy });
    const {
        likedBy: _likedBy,
        sellerContact: _sellerContact,
        ...safeProduct
    } = baseProduct;

    return {
        ...safeProduct,
        likesCount,
        likedByCurrentUser: currentUserId ? likedBy.includes(currentUserId) : false,
        displayRating: ratingSnapshot.rating,
        ratingSource: ratingSnapshot.source,
    };
}

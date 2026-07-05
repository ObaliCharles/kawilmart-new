import { getProductRatingSnapshot } from "@/lib/productRating";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOCATION_LABEL = "Uganda";

const getProductKey = (product) => String(product?._id || product?.name || "product");

const getProductTimestamp = (product) => {
  const numericDate = Number(product?.date);
  return Number.isFinite(numericDate) ? numericDate : 0;
};

const getAgeDays = (timestamp) => {
  if (!timestamp) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - timestamp) / DAY_IN_MS));
};

const getPriceValue = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getDiscountSnapshot = (product) => {
  const price = getPriceValue(product?.price);
  const offerPrice = getPriceValue(product?.offerPrice);

  if (price > offerPrice && offerPrice > 0) {
    return {
      hasDiscount: true,
      savingsAmount: price - offerPrice,
      priceDropPercent: Math.round(((price - offerPrice) / price) * 100),
    };
  }

  return {
    hasDiscount: false,
    savingsAmount: 0,
    priceDropPercent: 0,
  };
};

const getFreshnessMeta = (ageDays) => {
  if (!Number.isFinite(ageDays)) {
    return {
      isNewArrival: false,
      freshnessLabel: "",
      freshnessTone: "neutral",
      freshnessTier: "",
    };
  }

  if (ageDays <= 1) {
    return {
      isNewArrival: true,
      freshnessLabel: "Added today",
      freshnessTone: "fresh",
      freshnessTier: "today",
    };
  }

  if (ageDays <= 7) {
    return {
      isNewArrival: true,
      freshnessLabel: "Added this week",
      freshnessTone: "fresh",
      freshnessTier: "week",
    };
  }

  if (ageDays <= 30) {
    return {
      isNewArrival: false,
      freshnessLabel: "Added this month",
      freshnessTone: "neutral",
      freshnessTier: "month",
    };
  }

  return {
    isNewArrival: false,
    freshnessLabel: "",
    freshnessTone: "neutral",
    freshnessTier: "",
  };
};

const formatRemainingTime = (milliseconds) => {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return "";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return "<1m";
};

const getFlashDealSnapshot = (product) => {
  const flaggedAsFlashDeal = product?.isFlashDeal || product?.promotionType === "flash_deal";

  if (!flaggedAsFlashDeal) {
    return {
      flashDealActive: false,
      flashDealEndsAt: 0,
      flashDealEndsInMs: 0,
      flashDealCountdownLabel: "",
      hasFlashDealDeadline: false,
    };
  }

  const endsAt = product?.flashDealEndDate ? new Date(product.flashDealEndDate).getTime() : 0;
  const hasFlashDealDeadline = Number.isFinite(endsAt) && endsAt > 0;
  const flashDealEndsInMs = hasFlashDealDeadline ? Math.max(0, endsAt - Date.now()) : 0;
  const flashDealActive = !hasFlashDealDeadline || flashDealEndsInMs > 0;

  return {
    flashDealActive,
    flashDealEndsAt: flashDealActive ? endsAt : 0,
    flashDealEndsInMs: flashDealActive ? flashDealEndsInMs : 0,
    flashDealCountdownLabel: flashDealActive && hasFlashDealDeadline ? formatRemainingTime(flashDealEndsInMs) : "",
    hasFlashDealDeadline,
  };
};

export const getLocationLabel = (location) => {
  if (typeof location === "string" && location.trim()) {
    const [primaryLabel] = location
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (primaryLabel) {
      return primaryLabel;
    }
  }

  return DEFAULT_LOCATION_LABEL;
};

export const getProductActivitySnapshot = (product) => {
  const timestamp = getProductTimestamp(product);
  const ageDays = getAgeDays(timestamp);
  const localTrend = getLocationLabel(
    product?.sellerProfile?.location || product?.sellerLocation || product?.location
  );
  const likesCount = Math.max(
    0,
    Number(product?.likesCount) || (Array.isArray(product?.likedBy) ? product.likedBy.length : 0)
  );
  const reviews = Array.isArray(product?.reviews) ? product.reviews : [];
  const reviewCount = reviews.length;
  const ratingSnapshot = getProductRatingSnapshot({
    ...product,
    likesCount,
    reviews,
  });
  const discountSnapshot = getDiscountSnapshot(product);
  const freshnessMeta = getFreshnessMeta(ageDays);
  const flashDealSnapshot = getFlashDealSnapshot(product);

  return {
    key: getProductKey(product),
    ageDays,
    localTrend,
    likesCount,
    reviewCount,
    displayRating: ratingSnapshot.rating,
    hasRating: ratingSnapshot.hasRating,
    filledStars: ratingSnapshot.filledStars,
    ...discountSnapshot,
    ...freshnessMeta,
    ...flashDealSnapshot,
  };
};

export const getLiveActivityItems = (product) => {
  const activity = getProductActivitySnapshot(product);

  return [
    activity.hasDiscount
      ? {
          key: "discount",
          label: `Save ${activity.priceDropPercent}%`,
          tone: activity.flashDealActive ? "alert" : "warm",
        }
      : null,
    activity.hasRating
      ? {
          key: "rating",
          label: `Rated ${activity.displayRating}/5`,
          tone: "neutral",
        }
      : null,
    activity.reviewCount > 0
      ? {
          key: "reviews",
          label: `${activity.reviewCount} review${activity.reviewCount === 1 ? "" : "s"}`,
          tone: "neutral",
        }
      : activity.likesCount > 0
        ? {
            key: "likes",
            label: `${activity.likesCount} like${activity.likesCount === 1 ? "" : "s"}`,
            tone: "neutral",
          }
        : null,
    activity.flashDealActive && activity.flashDealCountdownLabel
      ? {
          key: "ends",
          label: `Ends in ${activity.flashDealCountdownLabel}`,
          tone: "alert",
        }
      : null,
    activity.freshnessLabel
      ? {
          key: "fresh",
          label: activity.freshnessLabel,
          tone: activity.freshnessTone,
        }
      : null,
    {
      key: "location",
      label: `Available in ${activity.localTrend}`,
      tone: "neutral",
    },
  ].filter(Boolean);
};

export const sortProductsForLiveShowcase = (products = []) => {
  return [...products].sort((leftProduct, rightProduct) => {
    const leftActivity = getProductActivitySnapshot(leftProduct);
    const rightActivity = getProductActivitySnapshot(rightProduct);
    const leftTimestamp = getProductTimestamp(leftProduct);
    const rightTimestamp = getProductTimestamp(rightProduct);

    const getScore = (product, activity, timestamp) => {
      const promotionBoost = activity.flashDealActive
        ? 52
        : product?.promotionType === "featured"
          ? 30
          : activity.hasDiscount || product?.promotionType === "discount"
            ? 22
            : 0;
      const freshnessBoost = Number.isFinite(activity.ageDays)
        ? Math.max(0, 14 - Math.min(activity.ageDays, 14))
        : 0;
      const ratingBoost = activity.hasRating ? Math.round(activity.displayRating * 8) : 0;
      const reviewBoost = Math.min(20, activity.reviewCount * 2);
      const likesBoost = Math.min(18, activity.likesCount);
      const savingsBoost = Math.min(24, activity.priceDropPercent);
      const recencyBoost = timestamp ? Math.max(0, 7 - Math.floor((Date.now() - timestamp) / DAY_IN_MS)) : 0;

      return (
        promotionBoost +
        freshnessBoost +
        ratingBoost +
        reviewBoost +
        likesBoost +
        savingsBoost +
        recencyBoost
      );
    };

    const scoreDifference =
      getScore(rightProduct, rightActivity, rightTimestamp) -
      getScore(leftProduct, leftActivity, leftTimestamp);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return rightTimestamp - leftTimestamp;
  });
};

export const getMarketplacePulseItems = (products = []) => {
  return products.slice(0, 8).map((product) => {
    const activity = getProductActivitySnapshot(product);
    const productHref = `/product/${product._id}`;
    const name = product?.name || "this item";

    let message = `${name} is available in ${activity.localTrend}`;

    if (activity.flashDealActive && activity.flashDealCountdownLabel) {
      message = `Flash deal on ${name} ends in ${activity.flashDealCountdownLabel}`;
    } else if (activity.hasRating && activity.reviewCount > 0) {
      message = `${name} is rated ${activity.displayRating}/5 from ${activity.reviewCount} review${activity.reviewCount === 1 ? "" : "s"}`;
    } else if (activity.likesCount > 0) {
      message = `${activity.likesCount} shoppers liked ${name}`;
    } else if (activity.hasDiscount) {
      message = `${name} is now ${activity.priceDropPercent}% off in ${activity.localTrend}`;
    } else if (activity.freshnessTier === "today") {
      message = `${name} was added today in ${activity.localTrend}`;
    } else if (activity.freshnessTier === "week") {
      message = `${name} was added this week in ${activity.localTrend}`;
    }

    return {
      key: `${activity.key}-pulse`,
      href: productHref,
      message,
    };
  });
};

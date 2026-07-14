export const computeBannerLifecycleStatus = (banner, now = new Date()) => {
    if (banner.status === "draft") {
        return "draft";
    }

    if (banner.startDate && now < new Date(banner.startDate)) {
        return "scheduled";
    }

    if (banner.endDate && now > new Date(banner.endDate)) {
        return "expired";
    }

    return "active";
};

export const isBannerCurrentlyActive = (banner, now = new Date()) =>
    computeBannerLifecycleStatus(banner, now) === "active";

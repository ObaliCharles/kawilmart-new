import "server-only";

import connectDB from "@/config/db";
import { resolveSiteContent } from "@/lib/defaultSiteContent";
import { isBannerCurrentlyActive } from "@/lib/bannerStatus";
import Banner from "@/models/Banner";
import SiteContent from "@/models/SiteContent";

export const getResolvedSiteContent = async () => {
    try {
        await connectDB();
        const content = await SiteContent.findOne({ key: "homepage" }).lean();
        return resolveSiteContent(content);
    } catch {
        return resolveSiteContent(null);
    }
};

const toHeroSlide = (banner) => ({
    _id: String(banner._id),
    title: banner.title || "",
    offer: banner.subtitle || "",
    imageUrl: banner.imageUrl || "",
    primaryButtonText: banner.ctaText || "Shop Now",
    secondaryButtonText: banner.secondaryCtaText || "Explore Deals",
    linkType: banner.linkType || "",
    category: banner.category || "",
    storeId: banner.storeId || "",
    productId: banner.productId || "",
    primaryHref: banner.href || "",
    secondaryHref: banner.secondaryHref || "/all-products?filter=flash",
});

const toFeaturedCard = (banner) => ({
    _id: String(banner._id),
    imageUrl: banner.imageUrl || "",
    title: banner.title || "",
    description: banner.subtitle || "",
    buttonText: banner.ctaText || "Buy now",
    linkType: banner.linkType || "",
    category: banner.category || "",
    storeId: banner.storeId || "",
    productId: banner.productId || "",
    href: banner.href || "",
});

const toPromoBanner = (banner) => ({
    _id: String(banner._id),
    title: banner.title || "",
    description: banner.subtitle || "",
    imageUrl: banner.imageUrl || "",
    buttonText: banner.ctaText || "Buy now",
    linkType: banner.linkType || "",
    category: banner.category || "",
    storeId: banner.storeId || "",
    productId: banner.productId || "",
    href: banner.href || "",
});

const toCategoryBanner = (banner) => ({
    ...toPromoBanner(banner),
    buttonText: banner.ctaText || "Shop now",
    placementCategory: banner.placementCategory || "",
});

const toBrandShowcase = (banner) => ({
    _id: String(banner._id),
    title: banner.title || "",
    brand: banner.brand || "",
    description: banner.subtitle || "",
    imageUrl: banner.imageUrl || "",
    linkType: banner.linkType || "brand",
    category: banner.category || "",
    storeId: banner.storeId || "",
    productId: banner.productId || "",
    href: banner.href || "",
    placementCategory: banner.placementCategory || "",
});

// Reads live Banner documents (instead of the legacy SiteContent sub-arrays)
// and reshapes them into the same object shape resolveSiteContent() expects,
// so MegaStoreHome/CategoryBrowserPage/Banner rendering code needs no changes.
export const getResolvedSiteContentFromBanners = async () => {
    try {
        await connectDB();
        const [siteContentDoc, banners] = await Promise.all([
            SiteContent.findOne({ key: "homepage" }).select("newsletter").lean(),
            Banner.find({ status: { $ne: "draft" } }).sort({ sortOrder: 1, createdAt: -1 }).lean(),
        ]);

        const now = new Date();
        const activeByType = (type) => banners.filter((banner) => banner.type === type && isBannerCurrentlyActive(banner, now));

        return resolveSiteContent({
            heroSlides: activeByType("hero").map(toHeroSlide),
            featuredCards: activeByType("featured").map(toFeaturedCard),
            promoBanners: activeByType("promo").map(toPromoBanner),
            sidebarPromoBanners: activeByType("sidebarPromo").map(toPromoBanner),
            categoryBanners: activeByType("category").map(toCategoryBanner),
            brandShowcases: activeByType("brandShowcase").map(toBrandShowcase),
            newsletter: siteContentDoc?.newsletter,
        });
    } catch {
        return resolveSiteContent(null);
    }
};

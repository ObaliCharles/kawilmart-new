import { assets } from "@/assets/assets";

const toPlainString = (value, fallback = "") => {
    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    if (value && typeof value === "object" && typeof value.src === "string") {
        return value.src;
    }

    return fallback;
};

const normalizeHeroSlide = (slide, fallbackSlide, index) => ({
    _id: toPlainString(slide?._id, fallbackSlide?._id || `hero-slide-${index + 1}`),
    title: toPlainString(slide?.title, fallbackSlide?.title || ""),
    offer: toPlainString(slide?.offer, fallbackSlide?.offer || ""),
    imageUrl: toPlainString(slide?.imageUrl, fallbackSlide?.imageUrl || ""),
    primaryButtonText: toPlainString(slide?.primaryButtonText, fallbackSlide?.primaryButtonText || "Shop Now"),
    secondaryButtonText: toPlainString(slide?.secondaryButtonText, fallbackSlide?.secondaryButtonText || "Explore Deals"),
    linkType: toPlainString(slide?.linkType, fallbackSlide?.linkType || ""),
    category: toPlainString(slide?.category, fallbackSlide?.category || ""),
    storeId: toPlainString(slide?.storeId, fallbackSlide?.storeId || ""),
    productId: toPlainString(slide?.productId, fallbackSlide?.productId || ""),
    primaryHref: toPlainString(slide?.primaryHref, fallbackSlide?.primaryHref || ""),
    secondaryHref: toPlainString(slide?.secondaryHref, fallbackSlide?.secondaryHref || "/all-products?filter=flash"),
    showOverlay: Boolean(slide?.showOverlay ?? fallbackSlide?.showOverlay),
});

const normalizeFeaturedCard = (card, fallbackCard, index) => ({
    _id: toPlainString(card?._id, fallbackCard?._id || `featured-card-${index + 1}`),
    imageUrl: toPlainString(card?.imageUrl, fallbackCard?.imageUrl || ""),
    title: toPlainString(card?.title, fallbackCard?.title || ""),
    description: toPlainString(card?.description, fallbackCard?.description || ""),
    buttonText: toPlainString(card?.buttonText, fallbackCard?.buttonText || "Buy now"),
    linkType: toPlainString(card?.linkType, fallbackCard?.linkType || ""),
    category: toPlainString(card?.category, fallbackCard?.category || ""),
    storeId: toPlainString(card?.storeId, fallbackCard?.storeId || ""),
    productId: toPlainString(card?.productId, fallbackCard?.productId || ""),
    href: toPlainString(card?.href, fallbackCard?.href || ""),
    showOverlay: Boolean(card?.showOverlay ?? fallbackCard?.showOverlay),
});

const normalizeBanner = (banner, fallbackBanner) => ({
    _id: toPlainString(banner?._id, fallbackBanner?._id || ""),
    title: toPlainString(banner?.title, fallbackBanner?.title || ""),
    description: toPlainString(banner?.description, fallbackBanner?.description || ""),
    imageUrl: toPlainString(banner?.imageUrl, fallbackBanner?.imageUrl || ""),
    buttonText: toPlainString(banner?.buttonText, fallbackBanner?.buttonText || "Buy now"),
    linkType: toPlainString(banner?.linkType, fallbackBanner?.linkType || ""),
    category: toPlainString(banner?.category, fallbackBanner?.category || ""),
    storeId: toPlainString(banner?.storeId, fallbackBanner?.storeId || ""),
    productId: toPlainString(banner?.productId, fallbackBanner?.productId || ""),
    href: toPlainString(banner?.href, fallbackBanner?.href || ""),
    showOverlay: Boolean(banner?.showOverlay ?? fallbackBanner?.showOverlay),
});

const normalizeCategoryBanner = (banner, fallbackBanner) => ({
    _id: toPlainString(banner?._id, fallbackBanner?._id || ""),
    title: toPlainString(banner?.title, fallbackBanner?.title || ""),
    description: toPlainString(banner?.description, fallbackBanner?.description || ""),
    imageUrl: toPlainString(banner?.imageUrl, fallbackBanner?.imageUrl || ""),
    buttonText: toPlainString(banner?.buttonText, fallbackBanner?.buttonText || "Shop now"),
    linkType: toPlainString(banner?.linkType, fallbackBanner?.linkType || ""),
    category: toPlainString(banner?.category, fallbackBanner?.category || ""),
    storeId: toPlainString(banner?.storeId, fallbackBanner?.storeId || ""),
    productId: toPlainString(banner?.productId, fallbackBanner?.productId || ""),
    href: toPlainString(banner?.href, fallbackBanner?.href || ""),
    placementCategory: toPlainString(banner?.placementCategory, fallbackBanner?.placementCategory || ""),
    showOverlay: Boolean(banner?.showOverlay ?? fallbackBanner?.showOverlay),
});

const normalizeBrandShowcase = (item, fallbackItem) => ({
    _id: toPlainString(item?._id, fallbackItem?._id || ""),
    title: toPlainString(item?.title, fallbackItem?.title || ""),
    brand: toPlainString(item?.brand, fallbackItem?.brand || ""),
    description: toPlainString(item?.description, fallbackItem?.description || ""),
    imageUrl: toPlainString(item?.imageUrl, fallbackItem?.imageUrl || ""),
    linkType: toPlainString(item?.linkType, fallbackItem?.linkType || "brand"),
    category: toPlainString(item?.category, fallbackItem?.category || ""),
    storeId: toPlainString(item?.storeId, fallbackItem?.storeId || ""),
    productId: toPlainString(item?.productId, fallbackItem?.productId || ""),
    href: toPlainString(item?.href, fallbackItem?.href || ""),
    placementCategory: toPlainString(item?.placementCategory, fallbackItem?.placementCategory || ""),
    showOverlay: Boolean(item?.showOverlay ?? fallbackItem?.showOverlay),
});

const normalizeNewsletter = (newsletter, fallbackNewsletter) => ({
    title: toPlainString(newsletter?.title, fallbackNewsletter?.title || ""),
    description: toPlainString(newsletter?.description, fallbackNewsletter?.description || ""),
    buttonText: toPlainString(newsletter?.buttonText, fallbackNewsletter?.buttonText || "Subscribe"),
});

export const defaultSiteContent = {
    heroSlides: [
        {
            _id: "default-hero-1",
            title: "Current audio deals from trusted local shops",
            offer: "Active discounts on headphones and speakers",
            imageUrl: assets.header_headphone_image.src,
            primaryButtonText: "Shop Now",
            secondaryButtonText: "Explore Deals",
            linkType: "category",
            category: "Audio",
            storeId: "",
            productId: "",
            primaryHref: "/all-products?category=Audio",
            secondaryHref: "/all-products?filter=flash",
        },
        {
            _id: "default-hero-2",
            title: "Gaming gear, controllers, and console extras in stock now",
            offer: "Featured accessories from active marketplace sellers",
            imageUrl: assets.header_playstation_image.src,
            primaryButtonText: "Shop Now",
            secondaryButtonText: "Explore Deals",
            linkType: "category",
            category: "Accessories",
            storeId: "",
            productId: "",
            primaryHref: "/all-products?category=Accessories",
            secondaryHref: "/all-products?filter=flash",
        },
        {
            _id: "default-hero-3",
            title: "Laptop picks for work, class, and creator setups",
            offer: "Fresh listings from current electronics stores",
            imageUrl: assets.header_macbook_image.src,
            primaryButtonText: "Shop Now",
            secondaryButtonText: "Explore Deals",
            linkType: "category",
            category: "Computers & Electronics",
            storeId: "",
            productId: "",
            primaryHref: "/all-products?category=Computers%20%26%20Electronics",
            secondaryHref: "/all-products?filter=flash",
        },
    ],
    featuredCards: [
        {
            _id: "default-feature-1",
            imageUrl: assets.girl_with_headphone_image.src,
            title: "Everyday audio, ready to ship",
            description: "Headphones, speakers, and daily sound gear from sellers already active on the marketplace.",
            buttonText: "Buy now",
            linkType: "category",
            category: "Audio",
            storeId: "",
            productId: "",
            href: "/all-products?category=Audio",
        },
        {
            _id: "default-feature-2",
            imageUrl: assets.girl_with_earphone_image.src,
            title: "Small accessories with real demand",
            description: "Explore earphones, chargers, and easy add-ons that fit daily shopping and gifting.",
            buttonText: "Buy now",
            linkType: "category",
            category: "Accessories",
            storeId: "",
            productId: "",
            href: "/all-products?category=Accessories",
        },
        {
            _id: "default-feature-3",
            imageUrl: assets.boy_with_laptop_image.src,
            title: "Laptops for work and study",
            description: "Browse current computer listings from sellers offering business, school, and creator-ready devices.",
            buttonText: "Buy now",
            linkType: "category",
            category: "Computers & Electronics",
            storeId: "",
            productId: "",
            href: "/all-products?category=Computers%20%26%20Electronics",
        },
    ],
    promoBanner: {
        _id: "default-promo-1",
        title: "Portable speakers and sound gear on promotion",
        description: "Check current discounts on speakers, chargers, and audio accessories from trusted local stores.",
        imageUrl: assets.jbl_soundbox_image.src,
        buttonText: "Browse promotions",
        linkType: "category",
        category: "Audio",
        storeId: "",
        productId: "",
        href: "/all-products?category=Audio",
    },
    categoryBanners: [
        {
            _id: "default-category-banner-1",
            title: "Latest Electronics",
            description: "Discover the latest gadgets and electronics from top brands.",
            imageUrl: assets.header_macbook_image.src,
            buttonText: "Shop Now",
            linkType: "category",
            category: "Computers & Electronics",
            storeId: "",
            productId: "",
            href: "/all-products?category=Computers%20%26%20Electronics",
            placementCategory: "Phones & Tablets",
        },
        {
            _id: "default-category-banner-2",
            title: "Fashion Picks",
            description: "New arrivals and style essentials from local sellers.",
            imageUrl: assets.girl_with_headphone_image.src,
            buttonText: "Shop Now",
            linkType: "category",
            category: "Fashion",
            storeId: "",
            productId: "",
            href: "/all-products?category=Fashion",
            placementCategory: "Fashion",
        },
        {
            _id: "default-category-banner-3",
            title: "Home Essentials",
            description: "Practical items for everyday living and home comfort.",
            imageUrl: assets.boy_with_laptop_image.src,
            buttonText: "Shop Now",
            linkType: "category",
            category: "Home & Living",
            storeId: "",
            productId: "",
            href: "/all-products?category=Home%20%26%20Living",
            placementCategory: "Home & Living",
        },
    ],
    brandShowcases: [
        {
            _id: "default-brand-1",
            title: "Samsung",
            brand: "Samsung",
            description: "Shop Samsung phones, screens, and accessories.",
            imageUrl: assets.samsung_s23phone_image.src,
            linkType: "brand",
            category: "",
            storeId: "",
            productId: "",
            href: "/all-products?brand=Samsung",
            placementCategory: "Electronics",
        },
        {
            _id: "default-brand-2",
            title: "Apple",
            brand: "Apple",
            description: "Discover Apple audio and mobile accessories.",
            imageUrl: assets.apple_earphone_image.src,
            linkType: "brand",
            category: "",
            storeId: "",
            productId: "",
            href: "/all-products?brand=Apple",
            placementCategory: "Electronics",
        },
        {
            _id: "default-brand-3",
            title: "Sony",
            brand: "Sony",
            description: "See Sony audio gear and entertainment products.",
            imageUrl: assets.sony_airbuds_image.src,
            linkType: "brand",
            category: "",
            storeId: "",
            productId: "",
            href: "/all-products?brand=Sony",
            placementCategory: "Electronics",
        },
    ],
    newsletter: {
        title: "Stay updated with new marketplace offers",
        description: "Join the newsletter for newly added products, active flash deals, and seller updates from KawilMart.",
        buttonText: "Subscribe",
    },
    aboutPage: {
        eyebrow: "About KawilMart",
        title: "Northern Uganda's trusted online marketplace for fashion, beauty, electronics, and everyday essentials.",
        intro: "KawilMart was built to make quality products easier to discover, compare, and buy from anywhere. We focus on categories people actually shop online in Uganda, backed by reliable local sellers and a smoother online marketplace experience.",
        story: "We started with a simple belief: online shopping in our region should feel fast, trustworthy, and personal. That means curated fashion, beauty, tech, home, and lifestyle products, transparent pricing, responsive support, and a storefront that helps customers move from discovery to checkout without friction.",
        mission: [
            "Make quality marketplace categories more accessible in Northern Uganda.",
            "Give local sellers better tools to showcase and grow their businesses.",
            "Create a shopping experience that feels modern, reliable, and easy to trust.",
        ],
        stats: [
            { label: "Fast product discovery", value: "Smart filters" },
            { label: "Local-first marketplace", value: "Trusted sellers" },
            { label: "Built for growth", value: "Admin + seller tools" },
        ],
    },
};

// Never falls back to placeholder/dummy hero, promo, featured, category, or
// brand content — an empty or missing array always resolves to an empty
// array so the storefront only ever renders banners that a real admin
// created. Newsletter copy and the static about-page content are the only
// fields that still fall back to editorial defaults, since those are UI
// copy rather than promotional/product content.
export const resolveSiteContent = (content) => {
    const safeContent = content || {};

    const heroSlides = Array.isArray(safeContent.heroSlides)
        ? safeContent.heroSlides.map((slide, index) => normalizeHeroSlide(slide, null, index))
        : [];
    const featuredCards = Array.isArray(safeContent.featuredCards)
        ? safeContent.featuredCards.map((card, index) => normalizeFeaturedCard(card, null, index))
        : [];
    const promoBanners = Array.isArray(safeContent.promoBanners)
        ? safeContent.promoBanners.map((banner) => normalizeBanner(banner, null))
        : [];
    const sidebarPromoBanners = Array.isArray(safeContent.sidebarPromoBanners)
        ? safeContent.sidebarPromoBanners.map((banner) => normalizeBanner(banner, null))
        : [];
    const categoryBanners = Array.isArray(safeContent.categoryBanners)
        ? safeContent.categoryBanners.map((banner, index) => normalizeCategoryBanner(banner, null, index))
        : [];
    const brandShowcases = Array.isArray(safeContent.brandShowcases)
        ? safeContent.brandShowcases.map((item, index) => normalizeBrandShowcase(item, null, index))
        : [];

    return {
        heroSlides,
        featuredCards,
        promoBanner: normalizeBanner(safeContent.promoBanner || promoBanners[0], null),
        promoBanners,
        sidebarPromoBanners,
        categoryBanners,
        brandShowcases,
        newsletter: normalizeNewsletter(safeContent.newsletter, defaultSiteContent.newsletter),
        aboutPage: defaultSiteContent.aboutPage,
    };
};

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
    bannerType: toPlainString(banner?.bannerType, fallbackBanner?.bannerType || "promo"),
    dealEndsAt: toPlainString(banner?.dealEndsAt, fallbackBanner?.dealEndsAt || ""),
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
        bannerType: "promo",
        dealEndsAt: "",
    },
    promoBanners: [
        {
            _id: "default-promo-1",
            title: "Flash sale essentials",
            description: "High-impact promotions with bold, image-first banners that fit the storefront hero rail.",
            imageUrl: assets.jbl_soundbox_image.src,
            buttonText: "Browse promotions",
            linkType: "category",
            category: "Audio",
            storeId: "",
            productId: "",
            href: "/all-products?filter=flash",
            bannerType: "promo",
            dealEndsAt: "",
        },
        {
            _id: "default-promo-2",
            title: "Bank Offers Up to 20% Off",
            description: "Use supported payment methods and unlock a cleaner, brighter offer card in the promo rail.",
            imageUrl: assets.girl_with_headphone_image.src,
            buttonText: "Shop offers",
            linkType: "custom",
            category: "",
            storeId: "",
            productId: "",
            href: "/all-products?filter=flash",
            bannerType: "promo",
            dealEndsAt: "",
        },
        {
            _id: "default-promo-3",
            title: "Refer & Earn UGX 10,000",
            description: "Invite friends with a clean image banner that matches the promotions area on desktop and mobile.",
            imageUrl: assets.boy_with_laptop_image.src,
            buttonText: "Refer now",
            linkType: "custom",
            category: "",
            storeId: "",
            productId: "",
            href: "/about",
            bannerType: "promo",
            dealEndsAt: "",
        },
        {
            _id: "default-promo-4",
            title: "Deal of the Day",
            description: "Timed deal cards can be uploaded with a countdown so the image banner stays fully visible.",
            imageUrl: assets.jbl_soundbox_image.src,
            buttonText: "Shop deal",
            linkType: "category",
            category: "Audio",
            storeId: "",
            productId: "",
            href: "/all-products?filter=flash",
            bannerType: "deal",
            dealEndsAt: "",
        },
    ],
    sidebarPromoBanners: [
        {
            _id: "default-sidebar-promo-1",
            title: "Weekend promo drops",
            description: "A separate sidebar slot for GIFs, lighter promos, and rotating campaign banners.",
            imageUrl: assets.girl_with_headphone_image.src,
            buttonText: "See promo",
            linkType: "custom",
            category: "",
            storeId: "",
            productId: "",
            href: "/all-products?sort=newest",
            bannerType: "promo",
            dealEndsAt: "",
        },
        {
            _id: "default-sidebar-promo-2",
            title: "Seller spotlight",
            description: "Highlight a store, campaign, or animated image without duplicating the rail content.",
            imageUrl: assets.boy_with_laptop_image.src,
            buttonText: "Open store",
            linkType: "category",
            category: "Computers & Electronics",
            storeId: "",
            productId: "",
            href: "/all-products?category=Computers%20%26%20Electronics",
            bannerType: "promo",
            dealEndsAt: "",
        },
    ],
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

export const resolveSiteContent = (content) => {
    if (!content) {
        return {
            ...defaultSiteContent,
            heroSlides: defaultSiteContent.heroSlides.map((slide, index) => normalizeHeroSlide(slide, slide, index)),
            featuredCards: defaultSiteContent.featuredCards.map((card, index) => normalizeFeaturedCard(card, card, index)),
            promoBanner: normalizeBanner(defaultSiteContent.promoBanner, defaultSiteContent.promoBanner),
            promoBanners: defaultSiteContent.promoBanners.map((banner, index) => normalizeBanner(banner, index === 0 ? defaultSiteContent.promoBanner : banner)),
            sidebarPromoBanners: defaultSiteContent.sidebarPromoBanners.map((banner, index) => normalizeBanner(banner, index === 0 ? defaultSiteContent.promoBanner : banner)),
            categoryBanners: defaultSiteContent.categoryBanners.map((banner, index) => normalizeCategoryBanner(banner, banner, index)),
            brandShowcases: defaultSiteContent.brandShowcases.map((item, index) => normalizeBrandShowcase(item, item, index)),
            newsletter: normalizeNewsletter(defaultSiteContent.newsletter, defaultSiteContent.newsletter),
        };
    }

    const resolvedPromoBanner = normalizeBanner(content.promoBanner, defaultSiteContent.promoBanner);
    const resolvedPromoBanners = Array.isArray(content.promoBanners) && content.promoBanners.length
        ? content.promoBanners.map((banner, index) =>
            normalizeBanner(banner, index === 0 ? resolvedPromoBanner : defaultSiteContent.promoBanner)
        )
        : defaultSiteContent.promoBanners.map((banner, index) => normalizeBanner(banner, index === 0 ? resolvedPromoBanner : banner));
    const resolvedSidebarPromoBanners = Array.isArray(content.sidebarPromoBanners) && content.sidebarPromoBanners.length
        ? content.sidebarPromoBanners.map((banner, index) =>
            normalizeBanner(banner, index === 0 ? resolvedPromoBanner : defaultSiteContent.promoBanner)
        )
        : defaultSiteContent.sidebarPromoBanners.map((banner, index) => normalizeBanner(banner, index === 0 ? resolvedPromoBanner : banner));

    return {
        heroSlides: Array.isArray(content.heroSlides)
            ? content.heroSlides.map((slide, index) =>
                normalizeHeroSlide(slide, defaultSiteContent.heroSlides[index] || defaultSiteContent.heroSlides[0], index)
            )
            : defaultSiteContent.heroSlides.map((slide, index) => normalizeHeroSlide(slide, slide, index)),
        featuredCards: Array.isArray(content.featuredCards)
            ? content.featuredCards.map((card, index) =>
                normalizeFeaturedCard(card, defaultSiteContent.featuredCards[index] || defaultSiteContent.featuredCards[0], index)
            )
            : defaultSiteContent.featuredCards.map((card, index) => normalizeFeaturedCard(card, card, index)),
        promoBanner: resolvedPromoBanner,
        promoBanners: resolvedPromoBanners,
        sidebarPromoBanners: resolvedSidebarPromoBanners,
        categoryBanners: Array.isArray(content.categoryBanners) && content.categoryBanners.length
            ? content.categoryBanners.map((banner, index) =>
                normalizeCategoryBanner(banner, defaultSiteContent.categoryBanners[index] || defaultSiteContent.categoryBanners[0], index)
            )
            : defaultSiteContent.categoryBanners.map((banner, index) => normalizeCategoryBanner(banner, banner, index)),
        brandShowcases: Array.isArray(content.brandShowcases) && content.brandShowcases.length
            ? content.brandShowcases.map((item, index) =>
                normalizeBrandShowcase(item, defaultSiteContent.brandShowcases[index] || defaultSiteContent.brandShowcases[0], index)
            )
            : defaultSiteContent.brandShowcases.map((item, index) => normalizeBrandShowcase(item, item, index)),
        newsletter: normalizeNewsletter(content.newsletter, defaultSiteContent.newsletter),
        aboutPage: defaultSiteContent.aboutPage,
    };
};

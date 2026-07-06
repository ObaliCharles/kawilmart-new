import mongoose from "mongoose";

const heroSlideSchema = new mongoose.Schema({
    title: { type: String, default: "" },
    offer: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    primaryButtonText: { type: String, default: "Shop Now" },
    secondaryButtonText: { type: String, default: "Explore Deals" },
    linkType: { type: String, default: "custom" },
    category: { type: String, default: "" },
    storeId: { type: String, default: "" },
    productId: { type: String, default: "" },
    primaryHref: { type: String, default: "" },
    secondaryHref: { type: String, default: "/all-products?filter=flash" },
}, { minimize: false });

const featuredCardSchema = new mongoose.Schema({
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    buttonText: { type: String, default: "Buy now" },
    linkType: { type: String, default: "custom" },
    category: { type: String, default: "" },
    storeId: { type: String, default: "" },
    productId: { type: String, default: "" },
    href: { type: String, default: "" },
}, { minimize: false });

const promoBannerSchema = new mongoose.Schema({
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    buttonText: { type: String, default: "Buy now" },
    linkType: { type: String, default: "custom" },
    category: { type: String, default: "" },
    storeId: { type: String, default: "" },
    productId: { type: String, default: "" },
    href: { type: String, default: "" },
}, { minimize: false });

const newsletterSchema = new mongoose.Schema({
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    buttonText: { type: String, default: "Subscribe" },
}, { _id: false, minimize: false });

const siteContentSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, default: "homepage" },
    heroSlides: { type: [heroSlideSchema], default: [] },
    featuredCards: { type: [featuredCardSchema], default: [] },
    promoBanners: { type: [promoBannerSchema], default: [] },
    promoBanner: { type: promoBannerSchema, default: () => ({}) },
    newsletter: { type: newsletterSchema, default: () => ({}) },
}, {
    timestamps: true,
    minimize: false,
});

const SiteContent = mongoose.models.site_content || mongoose.model("site_content", siteContentSchema);

export default SiteContent;

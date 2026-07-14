import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ["hero", "featured", "promo", "sidebarPromo", "category", "brandShowcase"],
    },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    ctaText: { type: String, default: "" },
    secondaryCtaText: { type: String, default: "" },
    linkType: { type: String, default: "custom" },
    category: { type: String, default: "" },
    storeId: { type: String, default: "" },
    productId: { type: String, default: "" },
    href: { type: String, default: "" },
    secondaryHref: { type: String, default: "" },
    brand: { type: String, default: "" },
    placementCategory: { type: String, default: "" },
    bannerSubtype: { type: String, default: "promo" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    status: { type: String, enum: ["draft", "scheduled", "active", "expired"], default: "draft" },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: String, default: "" },
}, { timestamps: true });

bannerSchema.index({ type: 1, status: 1, sortOrder: 1 });
bannerSchema.index({ status: 1, startDate: 1, endDate: 1 });

const Banner = mongoose.models.banner || mongoose.model("banner", bannerSchema);

export default Banner;

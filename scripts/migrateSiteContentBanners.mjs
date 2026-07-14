// One-off migration: copies banner-shaped data out of the singleton SiteContent
// document into standalone Banner documents. Safe to re-run — it skips any
// SiteContent sub-item that already has a matching Banner (matched by type +
// title + imageUrl) rather than blindly duplicating on a second run.
//
// Usage: node -r dotenv/config scripts/migrateSiteContentBanners.mjs
// (or:   node scripts/migrateSiteContentBanners.mjs   if MONGODB_URI is already exported)
//
// This does NOT delete anything from SiteContent — the original banner
// sub-arrays are left in place as a free rollback path.

import "dotenv/config";
import mongoose from "mongoose";
import Banner from "../models/Banner.js";
import SiteContent from "../models/SiteContent.js";

const parseLegacyDealEndsAt = (value) => {
    if (!value || typeof value !== "string") return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const migrations = [
    {
        arrayField: "heroSlides",
        type: "hero",
        map: (slide) => ({
            title: slide.title || "",
            subtitle: slide.offer || "",
            imageUrl: slide.imageUrl || "",
            ctaText: slide.primaryButtonText || "Shop Now",
            secondaryCtaText: slide.secondaryButtonText || "Explore Deals",
            linkType: slide.linkType || "custom",
            category: slide.category || "",
            storeId: slide.storeId || "",
            productId: slide.productId || "",
            href: slide.primaryHref || "",
            secondaryHref: slide.secondaryHref || "",
        }),
    },
    {
        arrayField: "featuredCards",
        type: "featured",
        map: (card) => ({
            title: card.title || "",
            subtitle: card.description || "",
            imageUrl: card.imageUrl || "",
            ctaText: card.buttonText || "Buy now",
            linkType: card.linkType || "custom",
            category: card.category || "",
            storeId: card.storeId || "",
            productId: card.productId || "",
            href: card.href || "",
        }),
    },
    {
        arrayField: "promoBanners",
        type: "promo",
        map: (banner) => ({
            title: banner.title || "",
            subtitle: banner.description || "",
            imageUrl: banner.imageUrl || "",
            ctaText: banner.buttonText || "Buy now",
            linkType: banner.linkType || "custom",
            category: banner.category || "",
            storeId: banner.storeId || "",
            productId: banner.productId || "",
            href: banner.href || "",
            bannerSubtype: banner.bannerType || "promo",
            endDate: parseLegacyDealEndsAt(banner.dealEndsAt),
        }),
    },
    {
        arrayField: "sidebarPromoBanners",
        type: "sidebarPromo",
        map: (banner) => ({
            title: banner.title || "",
            subtitle: banner.description || "",
            imageUrl: banner.imageUrl || "",
            ctaText: banner.buttonText || "View offer",
            linkType: banner.linkType || "custom",
            category: banner.category || "",
            storeId: banner.storeId || "",
            productId: banner.productId || "",
            href: banner.href || "",
            bannerSubtype: banner.bannerType || "promo",
            endDate: parseLegacyDealEndsAt(banner.dealEndsAt),
        }),
    },
    {
        arrayField: "categoryBanners",
        type: "category",
        map: (banner) => ({
            title: banner.title || "",
            subtitle: banner.description || "",
            imageUrl: banner.imageUrl || "",
            ctaText: banner.buttonText || "Shop now",
            linkType: banner.linkType || "custom",
            category: banner.category || "",
            storeId: banner.storeId || "",
            productId: banner.productId || "",
            href: banner.href || "",
            placementCategory: banner.placementCategory || "",
        }),
    },
    {
        arrayField: "brandShowcases",
        type: "brandShowcase",
        map: (item) => ({
            title: item.title || "",
            subtitle: item.description || "",
            imageUrl: item.imageUrl || "",
            brand: item.brand || "",
            href: item.href || "",
            placementCategory: item.placementCategory || "",
        }),
    },
];

const run = async () => {
    if (!process.env.MONGODB_URI) {
        console.error("Missing MONGODB_URI environment variable");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const siteContent = await SiteContent.findOne({ key: "homepage" }).lean();
    if (!siteContent) {
        console.log("No SiteContent document found — nothing to migrate.");
        await mongoose.disconnect();
        return;
    }

    let created = 0;
    let skipped = 0;

    for (const migration of migrations) {
        const items = Array.isArray(siteContent[migration.arrayField]) ? siteContent[migration.arrayField] : [];

        for (const item of items) {
            const mapped = migration.map(item);

            const existing = await Banner.findOne({
                type: migration.type,
                title: mapped.title,
                imageUrl: mapped.imageUrl,
            });

            if (existing) {
                skipped += 1;
                continue;
            }

            await Banner.create({
                type: migration.type,
                status: "active",
                startDate: null,
                sortOrder: 0,
                createdBy: "migration-script",
                ...mapped,
            });
            created += 1;
        }
    }

    console.log(`Migration complete. Created ${created} banner(s), skipped ${skipped} already-migrated item(s).`);
    await mongoose.disconnect();
};

run().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
});

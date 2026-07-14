// One-off seed: recreates the "Fresh Foods / Food Cupboard / Beverages /
// Household / Personal Care / Baby Care" subcategories as real Category
// documents under the "Home & Living" top-level category, since that grouping
// used to be hardcoded in three different files instead of coming from the
// database. Safe to re-run — skips any subcategory that already exists.
//
// This does NOT retag any existing products. After running it, use
// /admin/categories to review, and edit each grocery product in the seller
// form to assign it to the right subcategory — that's what makes items
// actually appear in these tiles again.
//
// Usage: node scripts/seedGrocerySubcategories.mjs

import "dotenv/config";
import mongoose from "mongoose";
import Category from "../models/Category.js";

const PARENT_VALUE = "Home & Living";

const subcategories = [
    { name: "Fresh Foods", icon: "🥬", sortOrder: 1 },
    { name: "Food Cupboard", icon: "🫙", sortOrder: 2 },
    { name: "Beverages", icon: "🍹", sortOrder: 3 },
    { name: "Household", icon: "🧴", sortOrder: 4 },
    { name: "Personal Care", icon: "🧼", sortOrder: 5 },
    { name: "Baby Care", icon: "🍼", sortOrder: 6 },
];

const run = async () => {
    if (!process.env.MONGODB_URI) {
        console.error("Missing MONGODB_URI environment variable");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    let created = 0;
    let skipped = 0;

    for (const subcategory of subcategories) {
        const existing = await Category.findOne({ parentValue: PARENT_VALUE, name: subcategory.name });
        if (existing) {
            skipped += 1;
            continue;
        }

        await Category.create({
            parentValue: PARENT_VALUE,
            name: subcategory.name,
            slug: subcategory.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            icon: subcategory.icon,
            sortOrder: subcategory.sortOrder,
            isActive: true,
        });
        created += 1;
    }

    console.log(`Seed complete. Created ${created} subcategor${created === 1 ? "y" : "ies"}, skipped ${skipped} already-existing.`);
    console.log("Next step: edit grocery products in the seller form and assign each to the right subcategory.");
    await mongoose.disconnect();
};

run().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
});

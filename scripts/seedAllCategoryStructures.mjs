// Optional one-off seed: loads the full existing (previously hardcoded)
// subcategory structure into the Category collection as real, editable
// records — so you start from the structure the site already had instead of
// building every subcategory by hand. Idempotent: skips any subcategory that
// already exists for a parent, so it will NOT overwrite or duplicate anything
// you've already added or edited in /admin/categories.
//
// Usage: node scripts/seedAllCategoryStructures.mjs

import "dotenv/config";
import mongoose from "mongoose";
import Category from "../models/Category.js";

// parentValue (a top-level Product.category value) -> [ { name, icon } ]
const structures = {
    "Fashion": [
        { name: "Shoes", icon: "👟" },
        { name: "Clothing", icon: "👕" },
        { name: "Bags", icon: "👜" },
        { name: "Watches", icon: "⌚" },
        { name: "Accessories", icon: "🧢" },
    ],
    "Beauty & Cosmetics": [
        { name: "Skincare", icon: "🧴" },
        { name: "Makeup", icon: "💄" },
        { name: "Hair Care", icon: "💇" },
        { name: "Fragrance", icon: "🌸" },
        { name: "Bath & Body", icon: "🧼" },
    ],
    "Health & Personal Care": [
        { name: "Wellness", icon: "💊" },
        { name: "Grooming", icon: "🪒" },
        { name: "Oral Care", icon: "🪥" },
        { name: "First Aid", icon: "🩹" },
        { name: "Fitness", icon: "🏋️" },
    ],
    "Home & Living": [
        { name: "Fresh Foods", icon: "🥬" },
        { name: "Food Cupboard", icon: "🫙" },
        { name: "Beverages", icon: "🍹" },
        { name: "Household", icon: "🧴" },
        { name: "Furniture", icon: "🛋️" },
        { name: "Kitchen", icon: "🍳" },
        { name: "Decor", icon: "🖼️" },
        { name: "Bedding", icon: "🛏️" },
    ],
    "Phones & Tablets": [
        { name: "Smartphones", icon: "📱" },
        { name: "Tablets", icon: "📲" },
        { name: "Cases", icon: "🛡️" },
        { name: "Chargers", icon: "🔌" },
        { name: "Power Banks", icon: "🔋" },
    ],
    "Computers & Electronics": [
        { name: "Laptops", icon: "💻" },
        { name: "Desktops", icon: "🖥️" },
        { name: "Monitors", icon: "🖵" },
        { name: "Cameras", icon: "📷" },
        { name: "Printers", icon: "🖨️" },
    ],
    "Audio": [
        { name: "Headphones", icon: "🎧" },
        { name: "Earphones", icon: "🎵" },
        { name: "Speakers", icon: "🔊" },
        { name: "Soundbars", icon: "📻" },
        { name: "Microphones", icon: "🎤" },
    ],
    "Watches & Wearables": [
        { name: "Smartwatches", icon: "⌚" },
        { name: "Fitness Bands", icon: "📿" },
        { name: "Watch Straps", icon: "➰" },
    ],
    "Accessories": [
        { name: "Chargers", icon: "🔌" },
        { name: "Cables", icon: "🔗" },
        { name: "Cases", icon: "🛡️" },
        { name: "Power Banks", icon: "🔋" },
        { name: "Mounts", icon: "📐" },
    ],
    "Appliances": [
        { name: "Kitchen", icon: "🍳" },
        { name: "Laundry", icon: "🧺" },
        { name: "Refrigeration", icon: "🧊" },
        { name: "Microwaves", icon: "🍲" },
        { name: "Fans", icon: "🌀" },
    ],
    "Baby Products": [
        { name: "Feeding", icon: "🍼" },
        { name: "Diapers", icon: "🧷" },
        { name: "Nursery", icon: "🧸" },
        { name: "Baby Care", icon: "🧴" },
        { name: "Toys", icon: "🪀" },
    ],
    "Office & Stationery": [
        { name: "Notebooks", icon: "📓" },
        { name: "Pens", icon: "🖊️" },
        { name: "Printers", icon: "🖨️" },
        { name: "Desk Supplies", icon: "📎" },
    ],
    "Sports & Outdoors": [
        { name: "Fitness", icon: "🏋️" },
        { name: "Camping", icon: "🏕️" },
        { name: "Football", icon: "⚽" },
        { name: "Cycling", icon: "🚲" },
        { name: "Running", icon: "🏃" },
    ],
};

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const run = async () => {
    if (!process.env.MONGODB_URI) {
        console.error("Missing MONGODB_URI environment variable");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    let created = 0;
    let skipped = 0;

    for (const [parentValue, subcategories] of Object.entries(structures)) {
        let sortOrder = 1;
        for (const subcategory of subcategories) {
            const existing = await Category.findOne({ parentValue, name: subcategory.name });
            if (existing) {
                skipped += 1;
                sortOrder += 1;
                continue;
            }

            await Category.create({
                parentValue,
                name: subcategory.name,
                slug: slugify(subcategory.name),
                icon: subcategory.icon,
                sortOrder,
                isActive: true,
            });
            created += 1;
            sortOrder += 1;
        }
    }

    console.log(`Seed complete. Created ${created} subcategor${created === 1 ? "y" : "ies"}, skipped ${skipped} already-existing.`);
    console.log("Review and edit them anytime in /admin/categories, then assign products to subcategories from the product form.");
    await mongoose.disconnect();
};

run().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
});

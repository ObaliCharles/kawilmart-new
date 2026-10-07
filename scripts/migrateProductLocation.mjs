// Additive, idempotent product-location backfill. This script never changes
// legacy text locations or other product data and never deletes records.
// Usage: node scripts/migrateProductLocation.mjs

import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";

const LOCATION_FIELDS = ["areaId", "landmark", "lat", "lng", "publicLat", "publicLng", "meetupSpot"];

const run = async () => {
    await connectDB();
    await Product.createIndexes();

    let updated = 0;
    for (const field of LOCATION_FIELDS) {
        const result = await Product.updateMany(
            { [field]: { $exists: false } },
            { $set: { [field]: null } }
        );
        updated += result.modifiedCount || 0;
    }

    console.log(`Product location migration complete. Backfilled ${updated} missing field value(s).`);
    await mongoose.disconnect();
};

run().catch(async (error) => {
    console.error("Product location migration failed:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});

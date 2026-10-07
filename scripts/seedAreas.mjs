// Idempotent initial area seed. Coordinates are intentionally limited to
// verified city centroids; lower-level records remain null until their
// boundaries/centroids are verified from an authoritative local source.
// Usage: node scripts/seedAreas.mjs

import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Area from "../models/Area.js";
import { INITIAL_AREA_SEED } from "../lib/locationAreaSeed.js";

export const seedAreas = async () => {
    const recordsByKey = new Map();

    for (const definition of INITIAL_AREA_SEED) {
        const parent = definition.parentKey ? recordsByKey.get(definition.parentKey) : null;
        if (definition.parentKey && !parent) {
            throw new Error(`Missing seeded parent ${definition.parentKey} for ${definition.name}`);
        }

        const filter = { parentId: parent?._id || null, name: definition.name };
        const record = await Area.findOneAndUpdate(
            filter,
            { $set: { type: definition.type, lat: definition.lat, lng: definition.lng } },
            { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );
        recordsByKey.set(definition.key, record);
    }

    return { total: recordsByKey.size };
};

const run = async () => {
    await connectDB();
    await Area.createIndexes();
    const result = await seedAreas();
    console.log(`Area seed complete. Ensured ${result.total} area records without duplicates.`);
    await mongoose.disconnect();
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    run().catch(async (error) => {
        console.error("Area seed failed:", error);
        await mongoose.disconnect().catch(() => {});
        process.exit(1);
    });
}

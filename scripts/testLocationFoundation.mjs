import assert from "node:assert/strict";
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Area from "../models/Area.js";
import {
    areValidCoordinates,
    calculateDistanceKm,
    createBlurredPublicCoordinates,
    getBoundingBox,
    getPublicProductLocation,
} from "../lib/productLocation.js";
import { INITIAL_AREA_SEED } from "../lib/locationAreaSeed.js";
import { serializeProductForClient } from "../lib/productRating.js";

assert.equal(INITIAL_AREA_SEED.length, 9);
assert.equal(new Set(INITIAL_AREA_SEED.map((area) => area.key)).size, INITIAL_AREA_SEED.length);
assert.equal(INITIAL_AREA_SEED.find((area) => area.key === "pece")?.parentKey, "gulu");
assert.equal(INITIAL_AREA_SEED.find((area) => area.key === "ntinda")?.parentKey, "kampala");

const privatePoint = { lat: 2.781667, lng: 32.299167 };
assert.equal(areValidCoordinates(privatePoint.lat, privatePoint.lng), true);
assert.equal(areValidCoordinates(91, privatePoint.lng), false);
assert.equal(areValidCoordinates(privatePoint.lat, 181), false);

const bounds = getBoundingBox(privatePoint.lat, privatePoint.lng, 10);
assert.ok(bounds.minLat < privatePoint.lat && bounds.maxLat > privatePoint.lat, "Bounding box must contain its centre latitude");
assert.ok(bounds.minLng < privatePoint.lng && bounds.maxLng > privatePoint.lng, "Bounding box must contain its centre longitude");
assert.equal(getBoundingBox(91, privatePoint.lng, 10), null, "Invalid coordinates must not create a bounding box");

for (let index = 0; index < 25; index += 1) {
    const blurred = createBlurredPublicCoordinates(privatePoint.lat, privatePoint.lng);
    const distance = calculateDistanceKm(privatePoint.lat, privatePoint.lng, blurred.lat, blurred.lng) * 1000;
    assert.notDeepEqual(blurred, privatePoint);
    assert.ok(distance >= 245 && distance <= 355, `Expected roughly 300m blur, received ${distance}m`);
}

const serializedProduct = serializeProductForClient({
    name: "Private location test",
    lat: privatePoint.lat,
    lng: privatePoint.lng,
    publicLat: 2.784,
    publicLng: 32.301,
    areaId: "pece",
    landmark: "Private landmark",
    meetupSpot: "Total Pece",
});
for (const field of ["lat", "lng", "publicLat", "publicLng", "areaId", "landmark", "meetupSpot"]) {
    assert.equal(field in serializedProduct, false, `Public product serialization must not include ${field}`);
}

const gulu = { _id: "gulu", name: "Gulu", type: "CITY", parentId: null };
const pece = { _id: "pece", name: "Pece", type: "DIVISION", parentId: "gulu" };
const publicLocation = getPublicProductLocation({
    areaId: "pece",
    lat: privatePoint.lat,
    lng: privatePoint.lng,
    publicLat: 2.784,
    publicLng: 32.301,
    landmark: "Near Pece Stadium",
    meetupSpot: "Total Pece",
}, {
    areasById: new Map([["gulu", gulu], ["pece", pece]]),
    buyerCoordinates: { lat: 2.78, lng: 32.3 },
});

assert.equal(publicLocation.displayName, "Gulu, Pece");
assert.equal(publicLocation.area, "Pece");
assert.equal("lat" in publicLocation, false);
assert.equal("lng" in publicLocation, false);
assert.equal("publicCoordinates" in publicLocation, false);
assert.ok(publicLocation.distanceKm >= 0);

if (process.argv.includes("--verify-db")) {
    await connectDB();
    const areas = await Area.find({ name: { $in: INITIAL_AREA_SEED.map((area) => area.name) } }).lean();
    assert.equal(areas.length, INITIAL_AREA_SEED.length, "Seeded areas must exist exactly once");

    const guluRecord = areas.find((area) => area.name === "Gulu" && !area.parentId);
    const peceRecord = areas.find((area) => area.name === "Pece");
    assert.ok(guluRecord && peceRecord, "Gulu and Pece seed records must exist");
    assert.equal(String(peceRecord.parentId), String(guluRecord._id), "Pece.parentId must be Gulu");
    await mongoose.disconnect();
    console.log("Seeded area hierarchy and idempotency check passed.");
}

console.log("Location foundation utility tests passed.");
